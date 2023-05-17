import MicroEE from 'microee'

import { hasNetworkInformationPlugin, isCordova } from 'cozy-device-helper'

import RetryManager from './RetryManager'
import SubscriptionList from './SubscriptionList'
import {
  raiseErrorAfterAttempts,
  timeBeforeSuccessful,
  baseWaitAfterFirstFailure,
  maxWaitBetweenRetries
} from './config'
import logger from './logger'
import {
  createWebSocket,
  getUrl,
  getToken,
  doctype,
  hasBrowserContext,
  getCozyClientFromOptions,
  isOnline
} from './utils'

/**
 * A cozy-client instance.
 * @typedef {import("cozy-client/dist/index").CozyClient} CozyClient
 */

/**
 * Manage the realtime interactions with a cozy stack
 */
class CozyRealtime {
  /**
   * @constructor
   * @param {object} options
   * @param {CozyClient}  options.client A cozy-client instance
   * @param {Function} options.createWebSocket The function used to create WebSocket instances
   */
  constructor(options) {
    this.client = getCozyClientFromOptions(options)
    this.createWebSocket = options.createWebSocket || createWebSocket
    this.subscriptions = new SubscriptionList()
    this.retryManager = new RetryManager({
      raiseErrorAfterAttempts,
      timeBeforeSuccessful,
      baseWaitAfterFirstFailure,
      maxWaitBetweenRetries
    })
    this.retryManager.on('error', err => this.emit('error', err))
    this.bindEventHandlers()
    if (isCordova() && !hasNetworkInformationPlugin()) {
      logger.warn(
        `This seems a Cordova app and cordova-plugin-network-information doesn't seem to be installed. Please install it from https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-network-information/ to support online and offline events.`
      )
    }
  }

  /**
   * Starts all handlers and try to connect if online.
   * If not online, the connection will take place when receiving
   * the `online` event.
   * @see onOnline()
   * @private
   */
  start() {
    if (!this.isStarted) {
      logger.info('started')
      this.isStarted = true
      this.retryManager.reset()
      this.subscribeGlobalEvents()
      this.subscribeClientEvents()
      this.subscribeCordovaEvents()
      this.emit('start')
      if (isOnline()) this.connect()
    }
  }

  /**
   * Creates and attach a WebSocket to the current instance
   *
   * @private
   * @returns {WebSocket} the created websocket
   */
  createSocket() {
    if (this.websocket) {
      logger.error(
        'Unexpected replacement of an existing socket, this should not happen. A `revokeWebSocket()` should have been called first inside CozyRealtime'
      )
      this.revokeWebSocket()
    }
    logger.info('creating a new websocket…')
    const url = getUrl(this.client)
    try {
      this.websocket = this.createWebSocket(url, doctype)
      this.websocket.authenticated = false
      this.websocket.onmessage = this.onWebSocketMessage
      this.websocket.onerror = this.onWebSocketError
      this.websocket.onopen = this.onWebSocketOpen
      this.websocket.onclose = this.onWebSocketClose
      return this.websocket
    } catch (error) {
      this.onWebSocketError(error)
    }
  }

  /**
   * Connects a new websocket as soon as possible
   * @private
   */
  async connect({ immediate = false } = {}) {
    logger.info('connecting…')
    // avoid multiple concurrent calls to connect, keeps the first one
    if (this.waitingForConnect) {
      logger.debug('Pending reconnection, skipping reconnect')
      if (immediate) this.retryManager.stopCurrentAttemptWaitingTime()
    } else {
      logger.debug('No pending reconnection, will reconnect')
      try {
        this.waitingForConnect = true
        if (!immediate) await this.retryManager.waitBeforeNextAttempt()
        this.createSocket()
      } finally {
        this.waitingForConnect = false
      }
    }
  }

  /**
   * Throws the previous socket and connect a new one
   * @private
   */
  async reconnect({ immediate = false } = {}) {
    if (this.hasWebSocket()) this.revokeWebSocket()
    this.connect({ immediate })
  }

  /**
   * Removes all handlers on a websocket to avoid callbacks from an old rejected socket
   * @private
   */
  revokeWebSocket() {
    this.emit('disconnected')
    if (this.hasWebSocket()) {
      logger.info('trashing the previous websocket…')
      this.websocket.onmessage = null
      this.websocket.onerror = err => {
        // XXX: discard errors
        logger.error(
          `Error while trying to close the websocket: ${err.message}`
        )
      }
      this.websocket.onopen = null
      this.websocket.onclose = null
      try {
        this.websocket.close()
      } catch (e) {
        // void
      } finally {
        this.websocket = null
      }
    } else {
      logger.error(
        'Trying to revoke a websocket that is not attached. This should not happen'
      )
    }
  }

  /**
   * Closes the Realtime
   * @private
   */
  stop() {
    if (this.isStarted) {
      logger.info('stopped')
      this.unsubscribeCordovaEvents()
      this.unsubscribeGlobalEvents()
      this.unsubscribeClientEvents()
      if (this.hasWebSocket()) {
        this.revokeWebSocket()
      }
      this.isStarted = false
      if (!this.subscriptions.isEmpty()) {
        this.unsubscribeAll()
      }
      this.emit('close')
    }
  }

  /**
   * Authenticates to the websocket
   * @private
   */
  authenticate() {
    if (this.isWebSocketOpen()) {
      const token = getToken(this.client)
      logger.debug('authenticate with', token)
      this.sendWebSocketMessage('AUTH', token)
      this.websocket.authenticated = true
    } else {
      logger.error(
        'Trying to authenticate to a non-opened websocket. This should not happen.',
        this.websocket,
        this.websocket && this.websocket.readyState
      )
    }
  }

  /**
   * Sends a message through the websocket
   *
   * @private
   * @param {string} method - like 'AUTH', 'SUBSCRIBE' or 'UNSUBSCRIBE'
   * @param {object} payload - message to be sent
   */
  sendWebSocketMessage(method, payload) {
    const message = JSON.stringify({ method, payload })
    this.websocket.send(message)
  }

  /**
   * Sends a realtime notification to the server
   *
   * @param {string} doctype
   * @param {string} id
   * @param {object} data
   */
  async sendNotification(doctype, id, data) {
    return this.client
      .getStackClient()
      .fetchJSON('POST', `/realtime/${doctype}/${id}`, {
        data
      })
  }
  send(...args) {
    if (!this.sendDeprecationNoticeSent) {
      this.sendDeprecationNoticeSent = true
      logger.warn(
        'Deprecation notice: CozyRealtime.send() is deprecated, please use CozyRealtime.sendNotification() from now on'
      )
    }
    return this.sendNotification(...args)
  }

  /**
   * Waits until the socket is ready (and never fail)
   */
  async waitForSocketReady() {
    if (this.isWebSocketAuthenticated()) return true
    return new Promise((resolve, reject) => {
      this.once('ready', resolve)
      this.once('close', reject)
    })
  }

  /**
   * Is there a websocket?
   *
   * @private
   * @returns {boolean} true if there is a websocket (may be not open or not authenticated)
   */
  hasWebSocket() {
    return !!this.websocket
  }

  /**
   * Is the websocket opened?
   *
   * @private
   * @returns {boolean} true if opened, but may not be authenticated yet
   */
  isWebSocketOpen() {
    return !!(
      this.hasWebSocket() && this.websocket.readyState === WebSocket.OPEN
    )
  }

  /**
   * Is the websocket ready and authenticated?
   *
   * @private
   * @returns {boolean} true if opened and authenticated
   */
  isWebSocketAuthenticated() {
    return !!(this.isWebSocketOpen() && this.websocket.authenticated)
  }

  /* * * * * * * * * * */
  /* * SUBSCRIPTIONS * */
  /* * * * * * * * * * */

  /**
   * Subscribes to an event, type, id
   *
   * @see `normalizeSubscription()` which describe the special signature
   *
   * @param {EventName} event
   * @param {string} type
   * @param {string|undefined|function} id - (or handler is `handler` is undefined)
   * @param {function|undefined} handler - (not used if `id` is a function)
   */
  subscribe(event, type, id, handler) {
    this.start() //  start the realtime in case it was stopped
    const sub = this.normalizeSubscription(event, type, id, handler)
    const has = this.subscriptions.hasSameTypeAndId(sub)
    this.subscriptions.add(sub)
    // send to the server if there wasn't any subscription with that type & id before
    if (!has && this.isWebSocketAuthenticated()) {
      this.sendSubscription(sub.type, sub.id)
    }
  }

  /**
   * Unsubscribes to an event, type, id
   *
   * @see `normalizeSubscription()` which describe the special signature
   *
   * @param {EventName} event
   * @param {string} type
   * @param {string|undefined|function} id - (or handler is `handler` is undefined)
   * @param {function|undefined} handler - (not used if `id` is a function)
   */
  unsubscribe(event, type, id, handler) {
    const sub = this.normalizeSubscription(event, type, id, handler)
    this.subscriptions.remove(sub)
    // if there is no more subscription of this type & id
    // then unsubscribe to the server
    const has = this.subscriptions.hasSameTypeAndId(sub)
    if (!has && this.isWebSocketAuthenticated()) {
      this.sendUnsubscription(sub.type, sub.id)
    }
    // if this was the last subscription, stop the realtime
    if (this.subscriptions.isEmpty()) this.stop()
  }

  /**
   * Unsubscribes to all events
   */
  unsubscribeAll() {
    const all = this.subscriptions.getAll()
    for (const { event, type, id, handler } of all) {
      this.unsubscribe(event, type, id, handler)
    }
  }

  /**
   * Sends all subscriptions to the current socket
   * @private
   */
  sendSubscriptions() {
    const pairs = this.subscriptions.getAllTypeAndIdPairs()
    for (const { type, id } of pairs) {
      this.sendSubscription(type, id)
    }
  }

  /**
   * Sends subscription to the websocket
   *
   * @private
   * @param {string} type - a doctype to subscribe to
   * @param {string} id - optional, a id to subscribe to
   */
  sendSubscription(type, id) {
    if (this.isWebSocketOpen()) {
      const payload = id ? { type, id } : { type }
      logger.debug('send subscription to', payload.type, payload.id)
      this.sendWebSocketMessage('SUBSCRIBE', payload)
    } else {
      logger.error(
        'Trying to subscribe on a non-ready socket. This should not happen. Type and id:',
        type,
        id
      )
    }
  }

  /**
   * Sends unsubscription to the websocket
   *
   * @private
   * @param {string} type - a doctype to unsubscribe to
   * @param {string} id - optional, a id to unsubscribe to
   */
  sendUnsubscription(type, id) {
    if (this.isWebSocketOpen()) {
      const payload = id ? { type, id } : { type }
      logger.debug('send unsubscription to', payload.type, payload.id)
      this.sendWebSocketMessage('UNSUBSCRIBE', payload)
    } else {
      logger.error(
        'Trying to subscribe on a non-ready socket. This should not happen. Type and id:',
        type,
        id
      )
    }
  }

  /**
   * Normalizes a subscription request object
   *
   * This allows to support the two different signatures possible
   * for the subscribe() and the unsubscribe() methods.
   *
   * One can call subscribe(event, type, id, handler) or
   * (event, type, handler) without an id. This method does normalize
   * so we can receive { event, type, id, handler } correctly whatever
   * the developper uses.
   *
   * @private
   * @param {EventName} event
   * @param {string} type
   * @param {string|undefined|function} id - (or handler is `handler` is undefined)
   * @param {function|undefined} handler - (not used if `id` is a function)
   * @returns {Subscription}
   */
  normalizeSubscription(event, type, id, handler) {
    return {
      event: event ? event.toUpperCase() : event,
      type: type,
      id: handler ? id : null,
      handler: handler || id
    }
  }

  /* * * * * * * */
  /* * EVENTS  * */
  /* * * * * * * */

  /**
   * Binds event handlers to the current instance
   * @private
   */
  async bindEventHandlers() {
    // websocket
    this.onWebSocketMessage = this.onWebSocketMessage.bind(this)
    this.onWebSocketError = this.onWebSocketError.bind(this)
    this.onWebSocketOpen = this.onWebSocketOpen.bind(this)
    this.onWebSocketClose = this.onWebSocketClose.bind(this)
    // cozy client
    this.onClientLogin = this.onClientLogin.bind(this)
    this.onClientTokenRefreshed = this.onClientTokenRefreshed.bind(this)
    this.onClientLogout = this.onClientLogout.bind(this)
    // global events
    this.onOnline = this.onOnline.bind(this)
    this.onOffline = this.onOffline.bind(this)
    this.onVisibilityChange = this.onVisibilityChange.bind(this)
    // cordova events
    this.onDeviceReady = this.onDeviceReady.bind(this)
    this.onResume = this.onResume.bind(this)
  }

  /* * * * * * * * * * * * */
  /* * WebSocket EVENTS  * */
  /* * * * * * * * * * * * */

  /**
   * When receiving a message from the Realtime socket - Invokes subscribed handlers
   *
   * @private
   * @param {object} message
   */
  onWebSocketMessage(message) {
    const { event, payload } = JSON.parse(message.data)
    logger.info('receive message from server', { event, payload })
    const handlers = this.subscriptions.getAllHandlersForEvent(
      event,
      payload.type,
      payload.id
    )
    for (const handler of handlers) {
      try {
        handler({ ...payload.doc, _type: payload.type })
      } catch (e) {
        logger.error(
          `handler did throw for ${event}, ${payload.type}, ${payload.id}`
        )
      }
    }
    if (event === 'error') {
      logger.warn('Stack returned an error', payload)
    }
  }

  /**
   * When an error raises in a websocket - reconnects
   * @private
   */
  onWebSocketError(error) {
    logger.info('An error was raised on the websocket', error)
    this.retryManager.onFailure(error)
    this.reconnect()
  }

  /**
   * When a websocket manages to get opened - authenticates and subscribes
   * @private
   */
  onWebSocketOpen() {
    this.retryManager.onSuccess()
    this.authenticate()
    this.sendSubscriptions()
    this.emit('ready')
  }

  /**
   * When a websocket is closed by something else - reconnects
   * @private
   */
  onWebSocketClose(event) {
    logger.info('The current websocket was closed by a third party', event)
    this.retryManager.onFailure(event)
    this.reconnect()
  }

  /* * * * * * * * * * * * * */
  /* * Cozy Client EVENTS  * */
  /* * * * * * * * * * * * * */

  /**
   * Registers event handlers for cozy-client events
   * @private
   */
  subscribeClientEvents() {
    this.client.on('login', this.onClientLogin)
    this.client.on('tokenRefreshed', this.onClientTokenRefreshed)
    this.client.on('logout', this.onClientLogout)
  }

  /**
   * Unregisters event handlers for cozy-client events
   * @private
   */
  unsubscribeClientEvents() {
    this.client.removeListener('login', this.onClientLogin)
    this.client.removeListener('tokenRefreshed', this.onClientTokenRefreshed)
    this.client.removeListener('logout', this.onClientLogout)
  }

  /**
   * When the cozy-client instance successfully login - re-authenticates
   * @private
   */
  onClientLogin() {
    logger.info('Received login from cozy-client')
    if (this.isWebSocketOpen()) {
      this.authenticate()
      // send subscriptions again, permissions may have changed
      this.sendSubscriptions()
    }
  }

  /**
   * When the cozy-client instance refresh its access token - re-authenticates
   * @private
   */
  onClientTokenRefreshed() {
    // The stack doesn't need a reconnection or a reauthentication
    // if we already have authenticated correctly.
    // We however can't assert that the token sent was not expired.
    // If this happenned, we should throw the socket and reconnect.
    //  Let's do that in all cases, as it won't be frequent anyways.
    if (this.hasWebSocket()) {
      this.revokeWebSocket()
    }
  }

  /**
   * When the cozy-client instance logs out - throws the socket, don't reconnect yet (no authentication)
   * @private
   */
  onClientLogout() {
    if (this.hasWebSocket()) {
      this.revokeWebSocket()
    }
  }

  /* * * * * * * * * * * */
  /* * Cordova EVENTS  * */
  /* * * * * * * * * * * */

  /**
   * Subscribes to cordova events
   * @private
   */
  subscribeCordovaEvents() {
    if (isCordova()) {
      document.addEventListener('deviceready', this.onDeviceReady)
      document.addEventListener('resume', this.onResume)
    }
  }

  /**
   * Unsubscribes to cordova events
   * @private
   */
  unsubscribeCordovaEvents() {
    if (isCordova()) {
      document.removeEventListener('deviceready', this.onDeviceReady)
      document.removeEventListener('resume', this.onResume)
    }
  }

  /**
   * when the device is ready (for Cordova)
   * @private
   */
  onDeviceReady() {
    // online and offline events were not ready
    // detach them (should not be needed, but it doesnt' harm
    // and we really  don't want to attach an event twice
    this.unsubscribeGlobalEvents()
    this.subscribeGlobalEvents()
  }

  /**
   * when the device resumes (for Cordova)
   * @see https://cordova.apache.org/docs/en/9.x/cordova/events/events.html#resume
   * @private
   */
  onResume() {
    this.reconnect({ immediate: true })
  }

  /* * * * * * * * * * * * * * * */
  /* * Global (browser) EVENTS * */
  /* * * * * * * * * * * * * * * */

  /**
   * Subscribes to global events
   * @private
   */
  subscribeGlobalEvents() {
    if (hasBrowserContext && window.addEventListener) {
      window.addEventListener('online', this.onOnline)
      window.addEventListener('offline', this.onOffline)
      window.addEventListener('visibilitychange', this.onVisibilityChange)
    }
  }

  /**
   * Unsubscribes to global events
   * @private
   */
  unsubscribeGlobalEvents() {
    if (hasBrowserContext && window.removeEventListener) {
      window.removeEventListener('online', this.onOnline)
      window.removeEventListener('offline', this.onOffline)
      window.removeEventListener('visibilitychange', this.onVisibilityChange)
    }
  }

  /**
   * When going online again - throws the socket and reconnect
   * @private
   */
  onOnline() {
    logger.info('reconnect because receiving an online event')
    this.reconnect({ immediate: true })
  }

  /**
   * When going offline - throws the socket, don't try to reconnect yet
   * @private
   */
  onOffline() {
    this.hasWebSocket() && this.revokeWebSocket()
  }

  /**
   * When the page visibility changes
   * @private
   */
  onVisibilityChange() {
    if (document.visibilityState && document.visibilityState === 'visible') {
      // if we have a reconnect waiting, do it immediatly
      this.retryManager.stopCurrentAttemptWaitingTime()
    }
  }
}

MicroEE.mixin(CozyRealtime)

export default CozyRealtime
