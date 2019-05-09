/* global WebSocket */
import MicroEE from 'microee'
import pickBy from 'lodash/pickBy'

/**
 * Socket class
 *
 * @class
 */
class Socket {
  /**
   * Doctype name on cozy stack
   *
   * @type {String}
   */
  _doctype = 'io.cozy.websocket'

  /**
   * An opened socket
   *
   * @type {WebSocket}
   */
  _webSocket = null

  /**
   * Function to return cozy client url
   *
   * @type {Function}
   */
  _url = null

  /**
   * Function to return cozy client token
   *
   * @type {Function}
   */
  _token = null

  /**
   * Handle WebSocket
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#Creating_a_WebSocket_object
   *
   * @constructor
   * @param {Function} getUrl  Function to return cozy client url
   * @param {Function} getToken  Function to return cozy client token
   */
  constructor(getUrl, getToken) {
    this._getUrl = getUrl
    this._getToken = getToken

    // removeAllListeners comes from microee
    this.removeAllListeners = this.removeAllListeners.bind(this)

    this.on('close', this.removeAllListeners)
  }

  isOpen() {
    return !!(this._webSocket && this._webSocket.readyState === WebSocket.OPEN)
  }

  isConnecting() {
    return !!(
      this._webSocket && this._webSocket.readyState === WebSocket.CONNECTING
    )
  }

  /**
   * Establish a realtime connection
   *
   * @return {Promise}  Promise of the opened websocket
   */
  connect() {
    return new Promise((resolve, reject) => {
      this._webSocket = new WebSocket(this._getUrl(), this._doctype)

      this._webSocket.onmessage = event => {
        const data = JSON.parse(event.data)
        const eventName = data.event.toLowerCase()
        const { type, id, doc } = data.payload

        this.emit('message', { type, id, eventName }, doc)
      }

      this._webSocket.onclose = event => this.emit('close', event)

      this._webSocket.onerror = error => {
        this._webSocket = null
        this.emit('error', error)
        reject(error)
      }

      this._webSocket.onopen = event => {
        this.authenticate()
        this.emit('open', event)
        resolve(event)
      }
    })
  }

  /**
   * Sends the authentication message to cozy stack
   *
   * @see https://github.com/cozy/cozy-stack/blob/master/docs/realtime.md#auth
   */
  authenticate() {
    if (this.isOpen()) {
      this._webSocket.send(
        JSON.stringify({ method: 'AUTH', payload: this._getToken() })
      )
    }
  }

  /**
   * Sends a SUBSCRIBE message to cozy stack
   *
   * @see https://github.com/cozy/cozy-stack/blob/master/docs/realtime.md#subscribe
   *
   * @param {String} type  Document doctype to subscribe to
   * @param {String} id  Document id to subscribe to (not required)
   */
  async subscribe(type, id) {
    if (!this.isOpen()) {
      await this.connect()
    }

    const payload = pickBy({ type, id })

    const message = JSON.stringify({
      method: 'SUBSCRIBE',
      payload
    })

    this._webSocket.send(message)
    this.emit(`subscribe_${type}_${id}`)
  }

  /**
   * Close socket
   */
  close() {
    if (this.isOpen()) {
      this._webSocket.close()
    } else {
      this.removeAllListeners()
    }
    this._webSocket = null
  }
}

MicroEE.mixin(Socket)

export default Socket
