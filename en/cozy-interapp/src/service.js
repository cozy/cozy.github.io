import { errorSerializer } from './helpers'

function listenClientData(intent, window) {
  return new Promise(resolve => {
    const messageEventListener = event => {
      if (event.origin !== intent.attributes.client) return

      window.removeEventListener('message', messageEventListener)
      resolve(event.data)
    }

    window.addEventListener('message', messageEventListener)
    window.parent.postMessage(
      {
        type: `intent-${intent._id}:ready`
      },
      intent.attributes.client
    )
  })
}

// maximize the height of an element
function maximize(element) {
  if (element && element.style) {
    element.style.height = '100%'
  }
}

export const start = request => (intentIdArg, serviceWindowArg) => {
  const serviceWindow =
    serviceWindowArg || (typeof window !== 'undefined' && window)
  if (!serviceWindow || !serviceWindow.document) {
    return Promise.reject(new Error('Intent service should be used in browser'))
  }

  // Maximize document, the whole iframe is handled by intents, clients and
  // services
  serviceWindow.addEventListener('load', () => {
    const { document } = serviceWindow
    ;[document.documentElement, document.body].forEach(maximize)
  })

  const intentId = intentIdArg || serviceWindow.location.search.split('=')[1]
  if (!intentId)
    return Promise.reject(new Error('Cannot retrieve intent from URL'))

  return request.get(intentId, { tryDOM: true }).then(intent => {
    let terminated = false
    let notifiedReadyToUse = false

    const sendMessage = message => {
      if (terminated)
        throw new Error('Intent service has already been terminated')
      serviceWindow.parent.postMessage(message, intent.attributes.client)
    }

    const compose = (action, doctype, data) =>
      new Promise(resolve => {
        const composeEventListener = event => {
          if (event.origin !== intent.attributes.client) return
          serviceWindow.removeEventListener('message', composeEventListener)
          return resolve(event.data)
        }

        serviceWindow.addEventListener('message', composeEventListener)

        sendMessage({
          type: `intent-${intent._id}:compose`,
          action,
          doctype,
          data
        })
      })

    const terminate = message => {
      sendMessage(message)
      terminated = true
    }

    const resizeClient = (dimensions, transitionProperty) => {
      if (terminated) throw new Error('Intent service has been terminated')

      sendMessage({
        type: `intent-${intent._id}:resize`,
        // if a dom element is passed, calculate its size
        dimensions: dimensions.element
          ? Object.assign({}, dimensions, {
              maxHeight: dimensions.element.clientHeight,
              maxWidth: dimensions.element.clientWidth
            })
          : dimensions,
        transition: transitionProperty
      })
    }

    const hideCross = () => {
      sendMessage({
        type: `intent-${intent._id}:hideCross`
      })
    }

    const showCross = () => {
      sendMessage({
        type: `intent-${intent._id}:showCross`
      })
    }

    const cancel = () => {
      terminate({ type: `intent-${intent._id}:cancel` })
    }

    // Prevent unfulfilled client promises when this window unloads for a
    // reason or another.
    serviceWindow.addEventListener('unload', () => {
      if (!terminated) cancel()
    })

    return listenClientData(intent, serviceWindow).then(data => {
      return {
        compose: compose,
        getData: () => data,
        getIntent: () => intent,
        terminate: doc => {
          const eventName =
            data && data.exposeIntentFrameRemoval
              ? 'exposeFrameRemoval'
              : 'done'
          return terminate({
            type: `intent-${intent._id}:${eventName}`,
            document: doc
          })
        },
        throw: error =>
          terminate({
            type: `intent-${intent._id}:error`,
            error: errorSerializer.serialize(error)
          }),
        resizeClient: resizeClient,
        cancel: cancel,
        hideCross: hideCross,
        showCross: showCross,
        notifyReadyToUse: () => {
          if (notifiedReadyToUse) {
            throw new Error('Intent service is already ready to use')
          }
          if (terminated) {
            throw new Error('Intent service is terminated')
          }
          notifiedReadyToUse = true
          sendMessage({ type: `intent-${intent._id}:readyToUse` })
        }
      }
    })
  })
}
