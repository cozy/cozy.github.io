import * as dom from './dom'
import { errorSerializer, pickService, pickSizes } from './helpers'
import IntentListener from './listener'

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
  let receiver, iframe, readyTimer
  // Set when the service sends `ready`: messages sent before would be lost
  let serviceWindow = null
  // The data to give the service at the handshake; sendData() replaces them until then
  let currentData = data
  const service = pickService(intent, options.filterServices)
  const serviceOrigin = new URL(service.href).origin
  // The service posts to the window its frame is in: the one of the element,
  // which may be an overlay of the app in another window
  const view = element.ownerDocument.defaultView || window

  const destroy = () => {
    clearTimeout(readyTimer)
    iframe && dom.remove(iframe)
    receiver && receiver.stopListening()
  }

  const onComplete = () => {
    destroy()
  }

  let prom = new Promise((resolve, reject) => {
    iframe = dom.insertIntentIframe(intent, element, service.href, {
      onload: options.onReady,
      title: options.title,
      className: options.className,
      focus: options.focus !== false
    })

    receiver = new IntentListener({
      intentId: intent.id,
      origin: serviceOrigin,
      getSource: () => iframe.contentWindow,
      window: view,

      onReady: event => {
        // A service frame that loads again does not get the data twice: an
        // upload would store its files twice
        if (serviceWindow) return
        clearTimeout(readyTimer)
        serviceWindow = event.source
        event.source.postMessage(currentData, event.origin)
        if (options.onServiceReady) options.onServiceReady()
      },

      onReadyToUse: () => {
        if (options.onReadyToUse) options.onReadyToUse()
      },

      onResult: event => {
        if (options.onResult) options.onResult(event.data.result)
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
        // The event is of the realm of the window listened to
        reject(
          errorOrEvent instanceof view.Event
            ? errorSerializer.deserialize(errorOrEvent.data.error)
            : errorOrEvent
        )
        onComplete()
      },

      onResize: event => {
        const { transition, dimensions } = event.data
        const resize = { dimensions: pickSizes(dimensions) }
        if (typeof transition === 'string') resize.transition = transition
        if (options.onResize) {
          options.onResize(resize)
        } else {
          dom.applyStyle(element, {
            transition: resize.transition,
            ...resize.dimensions
          })
        }
      },

      onExposeFrameRemoval: event => {
        receiver.stopListening()
        resolve({
          document: event.data.document,
          removeIntentIframe: destroy
        })
      },

      onCompose: async event => {
        const { action, doctype, data } = event.data
        const { source, origin } = event
        // Let start to name `type` as `doctype`, as `event.data` already have a `type` attribute.
        const intent = await createIntent(action, doctype, data)
        dom.hide(iframe)
        try {
          const doc = await start(
            createIntent,
            intent,
            element,
            { ...data, exposeIntentFrameRemoval: false },
            {
              title: options.title,
              className: options.className,
              onResize: options.onResize,
              readyTimeout: options.readyTimeout
            }
          )
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
    // A service that never says ready (app missing, signed out, unreachable)
    // would keep the intent pending forever
    if (options.readyTimeout) {
      readyTimer = setTimeout(() => {
        reject(new Error('The intent service did not get ready in time'))
        onComplete()
      }, options.readyTimeout)
    }
  })

  prom.destroy = destroy
  // New data for the service while the intent goes on. Before the service is
  // ready, they take the place of the first ones.
  prom.sendData = newData => {
    currentData = newData
    if (serviceWindow) {
      serviceWindow.postMessage(
        { type: `intent-${intent.id}:data`, data: newData },
        serviceOrigin
      )
    }
  }
  return prom
}
