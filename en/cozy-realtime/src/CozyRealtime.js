import MicroEE from 'microee'
import Socket from './Socket'
import minilog_ from 'minilog'

const minilog = (typeof window !== undefined && window.minilog) || minilog_
const logger = minilog('cozy-realtime')
minilog.suggest.deny('cozy-realtime', 'info')

const INDEX_KEY_SEPARATOR = '//'

/**
 * Generate a key for an event
 *
 * @return {String}  Event key
 */
export const generateKey = (eventName, type, id) =>
  `${eventName}${INDEX_KEY_SEPARATOR}${type}${INDEX_KEY_SEPARATOR}${id}`

const getHandlerAndId = (handlerOrId, handlerOrUndefined) => {
  if (
    typeof handlerOrId !== 'function' &&
    typeof handlerOrUndefined !== 'function'
  ) {
    throw new Error('You should call this function with an handler')
  }

  let id, handler
  if (!handlerOrUndefined) {
    id = undefined
    handler = handlerOrId
  } else {
    id = handlerOrId
    handler = handlerOrUndefined
  }

  return { id, handler }
}

const validateParameters = (eventName, type, id, handler) => {
  let msg

  if (!['created', 'updated', 'deleted'].includes(eventName)) {
    msg = `'${eventName}' is not a valid event, valid events are 'created', 'updated' or 'deleted'.`
  }

  if (typeof type !== 'string') {
    msg = `'${type}' is not a valide type, it should be a string.`
  }

  if (id && eventName === 'created') {
    msg = `The 'id' should not be specified for 'created' event.`
  }

  if (typeof handler !== 'function') {
    msg = `The handler '${handler}' should be a function.`
  }

  if (msg) {
    logger.error(msg)
    throw new Error(msg)
  }
}

/**
 * Return websocket url from cozyClient
 *
 * @return {String}  WebSocket url
 */
export const getWebSocketUrl = cozyClient => {
  const isSecureURL = url => !!url.match(`^(https:/{2})`)

  const url = cozyClient.stackClient.uri
  const protocol = isSecureURL(url) ? 'wss:' : 'ws:'
  const host = new URL(url).host

  return `${protocol}//${host}/realtime/`
}

/**
 * Return token from cozyClient
 *
 * @return {String}  token
 */
export const getWebSocketToken = cozyClient =>
  cozyClient.stackClient.token.accessToken || cozyClient.stackClient.token.token

/**
 * CozyRealtime class
 *
 * @class
 */
class CozyRealtime {
  /**
   * A cozy client
   *
   * @type {CozyClient}
   */
  _cozyClient = null

  /**
   * A Socket class
   *
   * @type {Socket}
   */
  _socket = null

  /**
   * Delay (ms) to retry socket connection
   *
   * @type {Interger}
   */
  _retryDelay = 1000

  /**
   * Limit of socket connection
   */
  _retryLimit = 60

  /**
   * Constructor of CozyRealtime:
   * - Save cozyClient
   * - create socket
   * - listen cozyClient events
   * - unsubscribeAll if window unload
   *
   * @constructor
   * @param {CozyClient} client  A cozy client
   * @param {CozyClient} cozyClient  A cozy client [DEPRECATED]
   */
  constructor({ cozyClient, client }) {
    if (cozyClient) {
      console.warn(
        'Realtime: options.cozyClient is deprecated, please use options.client'
      )
    }
    this._cozyClient = client || cozyClient
    if (!this._cozyClient) {
      throw new Error(
        'Realtime must be initialized with a client. Ex: new Realtime({ client })'
      )
    }

    this._updateAuthentication = this._updateAuthentication.bind(this)
    this.unsubscribeAll = this.unsubscribeAll.bind(this)
    this._receiveMessage = this._receiveMessage.bind(this)
    this._receiveError = this._receiveError.bind(this)
    this._resubscribe = this._resubscribe.bind(this)
    this._beforeUnload = this._beforeUnload.bind(this)
    this._resetSocket = this._resetSocket.bind(this)

    this._createSocket()

    this._cozyClient.on('login', this._updateAuthentication)
    this._cozyClient.on('tokenRefreshed', this._updateAuthentication)
    this._cozyClient.on('logout', this.unsubscribeAll)

    if (global) {
      global.addEventListener('beforeunload', this._beforeUnload)
      global.addEventListener('online', this._resubscribe)
      global.removeEventListener('offline', this._resetSocket)
    }
  }

  _beforeUnload() {
    global.removeEventListener('beforeunload', this._windowUnload)
    this.unsubscribeAll()
  }

  /**
   * Create a Socket with cozyClient credential
   */
  _createSocket() {
    if (!this._socket) {
      const getUrl = () => getWebSocketUrl(this._cozyClient)
      const getToken = () => getWebSocketToken(this._cozyClient)

      this._socket = new Socket(getUrl, getToken)
      this._socket.on('message', this._receiveMessage)
      this._socket.on('error', this._receiveError)
    }
  }

  /**
   * When socket send error it test to reconnect
   */
  _receiveError(error) {
    logger.info(`Receive error: ${error}`)

    this._resetSocket()

    if (this._retryLimit === 0) {
      this.emit('error', error)
    } else {
      if (this.retry) {
        clearTimeout(this.retry)
      }
      if (global.navigator.onLine) {
        this.retry = setTimeout(this._resubscribe, this._retryDelay)
      }
    }
  }

  /**
   * Re subscribe on server
   */
  _resubscribe() {
    this._retryLimit--

    const subscribeList = Object.keys(this._events)
      .map(key => {
        if (!key.includes(INDEX_KEY_SEPARATOR)) return
        if (this._events[key].length === 0) return
        let [, type, id] = key.split(INDEX_KEY_SEPARATOR)
        if (id === 'undefined') id = undefined
        return { type, id }
      })
      .filter(Boolean)

    for (const { type, id } of subscribeList) {
      this._socket.subscribe(type, id)
    }
  }

  /**
   * Launch handlers
   */
  _receiveMessage({ type, id, eventName }, doc) {
    const keys = [generateKey(eventName, type)]
    if (id) {
      keys.push(generateKey(eventName, type, id))
    }

    for (const key of keys) {
      logger.debug('Emitting', key, doc)
      this.emit(key, doc)
    }
  }

  /**
   * Update token on socket
   */
  _updateAuthentication() {
    logger.info('Update token on socket')
    this._socket.authenticate()
  }

  /**
   * Reset socket
   */
  _resetSocket() {
    if (this._socket) {
      this._socket.close()
      this._socket = null
    }
    this._createSocket()
  }

  /**
   * Remove the given handler from the list of handlers for given
   * doctype/document and event.
   *
   * @param  {String}  type      Document doctype to subscribe to
   * @param  {String}  id        Document id to subscribe to
   * @param  {String}  eventName Event to subscribe to
   * @param  {Function}  handler   Function to call when an event of the
   * given type on the given doctype or document is received from stack.
   * @return {Promise}           Promise that the message has been sent.
   */
  subscribe(eventName, type, handlerOrId, handlerOrUndefined) {
    const { handler, id } = getHandlerAndId(handlerOrId, handlerOrUndefined)
    validateParameters(eventName, type, id, handler)

    if (this._socket.isConnecting()) {
      return new Promise(resolve => {
        this._socket.once('open', async () => {
          await this.subscribe(eventName, type, handlerOrId, handlerOrUndefined)
          resolve()
        })
      })
    }

    return new Promise(resolve => {
      const key = generateKey(eventName, type, id)
      this.on(key, handler)

      this._socket.once(`subscribe_${type}_${id}`, resolve)
      this._socket.subscribe(type, id)
    })
  }

  /**
   * Remove the given handler from the list of handlers for given
   * doctype/document and event.
   *
   * @param {String}  type      Document doctype to unsubscribe from
   * @param {String}  id        Document id to unsubscribe from
   * @param {String}  eventName Event to unsubscribe from
   * @param {Function}  handler   Function to call when an event of the
   * given type on the given doctype or document is received from stack.
   */
  unsubscribe(eventName, type, handlerOrId, handlerOrUndefined) {
    const { handler, id } = getHandlerAndId(handlerOrId, handlerOrUndefined)
    validateParameters(eventName, type, id, handler)
    const key = generateKey(eventName, type, id)

    this.removeListener(key, handler)

    if (!this._haveEventHandler()) {
      this._resetSocket()
    }
  }

  /**
   * Unsubscibe all handlers and close socket
   */
  unsubscribeAll() {
    this._getEventKeys()
      .map(key => this._events[key].length > 0 && key)
      .filter(Boolean)
      .forEach(key => (this._events[key] = []))

    this._resetSocket()
  }

  _getEventKeys() {
    if (!this._events) return []

    return Object.keys(this._events)
      .map(key => key.includes(INDEX_KEY_SEPARATOR) && key)
      .filter(Boolean)
  }

  _haveEventHandler() {
    return (
      this._getEventKeys()
        .map(key => this._events[key].length)
        .filter(Boolean).length > 0
    )
  }
}

MicroEE.mixin(CozyRealtime)

export default CozyRealtime
