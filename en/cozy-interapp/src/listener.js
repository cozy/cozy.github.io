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
    if (event.origin !== this.options.origin) {
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
    // Other frames of the page, of the same origin or not, are none of this
    // intent's business: other intents, embedded apps. Except for the cancel
    // of a service page that went away: the browser gives it no source any
    // more, its origin and the handshake vouch for it.
    if (
      event.source !== this.options.getSource() &&
      !(subtype === 'cancel' && event.source === null && this.state.handshaken)
    ) {
      return
    }
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
   * Primary handler for DOM messages. Passes any error of the real message
   * handler, thrown or rejected by an async one as compose, to the
   * options.onError callback.
   */
  handleMessageWrapper(ev) {
    try {
      const handled = this.handleMessage(ev)
      if (handled && typeof handled.catch === 'function') {
        handled.catch(this.options.onError)
      }
    } catch (e) {
      this.options.onError(e)
    }
  }

  listen() {
    this.options.window.addEventListener('message', this.handleMessageWrapper)
  }

  stopListening() {
    this.options.window.removeEventListener(
      'message',
      this.handleMessageWrapper
    )
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
