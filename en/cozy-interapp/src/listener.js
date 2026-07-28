/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

const intentTypeRx = /intent-(.*):(.*)/

/**
 * Listens to `message` DOM events for the specific intent and
 * forwards them to callbacks passed in options.
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
    const eventType = event.data.type
    if (eventType === 'load') {
      // Safari 9.1 (At least) send a MessageEvent when the iframe loads,
      // making the handshake fails.
      console.warn &&
        console.warn(
          'Cozy Client ignored MessageEvent having data.type `load`.'
        )
      return
    }

    const parts = intentTypeRx.exec(eventType)
    if (!parts) {
      console.warn(
        `intents: Message type ${eventType} not matching intent format`
      )
      return
    }
    const id = parts[1]
    assert(
      id == this.options.intentId,
      'Invalid event id',
      `eventId: ${id} != listener eventId ${this.options.intentId}`
    )

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

const assert = (cond, msg, extraMsg) => {
  if (!cond) {
    if (extraMsg) {
      console.warn(extraMsg)
    }
    throw new Error(msg)
  }
}

const capitalize = str => {
  return str[0].toUpperCase() + str.slice(1)
}
