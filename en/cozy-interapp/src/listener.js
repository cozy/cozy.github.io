/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const intentTypeRx = /^intent-(.*):(.*)$/

/**
 * Listens to `message` DOM events of the service frame for the specific
 * intent and forwards them to callbacks passed in options.
 *
 * Will throw if an event is received and no ready message
 * has been received first.
 */
export default class IntentListener {
  constructor(options) {
    this.state = { handshaken: false }
    this.options = options
    this.handleMessageWrapper = this.handleMessageWrapper.bind(this)
  }

  handleMessage(event) {
    // Other frames of the page, of the same origin or not, are none of this
    // intent's business: other intents, embedded apps
    if (
      event.origin !== this.options.origin ||
      event.source !== this.options.getSource()
    ) {
      return
    }
    const { data } = event
    const parts =
      typeof data === 'object' &&
      data !== null &&
      typeof data.type === 'string' &&
      intentTypeRx.exec(data.type)
    if (!parts) {
      return
    }
    const id = parts[1]
    if (id != this.options.intentId) {
      return
    }

    const subtype = parts[2]
    if (subtype !== 'ready') {
      assert(
        this.state.handshaken,
        'Unexpected handshake message from intent service'
      )
    } else {
      this.state.handshaken = true
    }

    const handler = this.options['on' + capitalize(subtype)]
    if (handler) {
      return handler(event)
    } else {
      console.warn(`intents: Unhandled event ${subtype}`)
    }
  }

  /**
   * Primary handler for DOM messages. Passes any thrown error from
   * the real message handler to the options.onError callback.
   */
  handleMessageWrapper(ev) {
    try {
      this.handleMessage(ev)
    } catch (e) {
      this.options.onError(e)
    }
  }

  listen() {
    window.addEventListener('message', this.handleMessageWrapper)
  }

  stopListening() {
    window.removeEventListener('message', this.handleMessageWrapper)
  }
}

const assert = (cond, msg) => {
  if (!cond) {
    throw new Error(msg)
  }
}

const capitalize = str => {
  return str[0].toUpperCase() + str.slice(1)
}
