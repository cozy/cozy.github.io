import * as dom from './dom'
import { errorSerializer, pickService } from './helpers'
import IntentListener from './listener'

/**
 * Keeps only http://domain:port/
 */
const extractOrigin = url => {
  return url.split('/', 3).join('/')
}

/**
 * Creates the intent iframe and reacts to its messages.
 *
 * 1. Converts done/error/cancel/exposeFrameRemoval into Promise resolve/reject
 * 2. Handles resize to style the DOM element holding the intent
 * 3. Handles compose to create a child intent
 * 4. Manages the lifecycle of the iframe. It is inserted into the DOM
 *    at the beginning and removed when the intent has completed.
 */
export function start(createIntent, intent, element, data, options = {}) {
  let receiver, iframe

  const destroy = () => {
    iframe && dom.remove(iframe)
    receiver && receiver.stopListening()
  }

  const onComplete = () => {
    destroy()
  }

  let prom = new Promise((resolve, reject) => {
    const service = pickService(intent, options.filterServices)
    iframe = dom.insertIntentIframe(
      intent,
      element,
      service.href,
      options.onReady
    )

    const serviceOrigin = extractOrigin(service.href)

    receiver = new IntentListener({
      intentId: intent.id,
      origin: serviceOrigin,

      onReady: event => {
        event.source.postMessage(data, event.origin)
      },

      onReadyToUse: () => {
        if (options.onReadyToUse) options.onReadyToUse()
      },

      onDone: event => {
        resolve(event.data.document)
        onComplete()
      },

      onCancel: () => {
        resolve(null)
        onComplete()
      },

      onError: errorOrEvent => {
        reject(
          errorOrEvent instanceof Event
            ? errorSerializer.deserialize(errorOrEvent.data.error)
            : errorOrEvent
        )
        onComplete()
      },

      onResize: event => {
        const { transition, dimensions } = event.data
        dom.applyStyle(element, {
          transition: transition,
          ...dimensions
        })
      },

      onExposeFrameRemoval: event => {
        resolve({
          document: event.data.document,
          removeIntentIframe: () => dom.remove(iframe)
        })
      },

      onCompose: async event => {
        const { action, doctype, data } = event.data
        const { source, origin } = event
        // Let start to name `type` as `doctype`, as `event.data` already have a `type` attribute.
        const intent = await createIntent(action, doctype, data)
        dom.hide(iframe)
        try {
          const doc = await start(createIntent, intent, element, {
            ...data,
            exposeIntentFrameRemoval: false
          })
          source.postMessage(doc, origin)
        } finally {
          dom.show(iframe)
        }
      },
      onHideCross: () => {
        if (options.onHideCross) {
          options.onHideCross()
        }
      },
      onShowCross: () => {
        if (options.onShowCross) {
          options.onShowCross()
        }
      }
    })

    receiver.listen()
  })

  prom.destroy = destroy
  return prom
}
