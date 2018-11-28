/* global WebSocket */

// Custom object wrapping logic to websocket and exposing a subscription
// interface
let cozySocket

// Important, must match the spec,
// see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
const WEBSOCKET_STATE = {
  OPEN: 1
}

const NUM_RETRIES = 3
const RETRY_BASE_DELAY = 1000

// Send a subscribe message for the given doctype trough the given websocket, but
// only if it is in a ready state. If not, retry a few milliseconds later.
function subscribeWhenReady(doctype, socket) {
  if (socket.readyState === WEBSOCKET_STATE.OPEN) {
    try {
      socket.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          payload: {
            type: doctype
          }
        })
      )
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Cannot subscribe to doctype ${doctype}: ${error.message}`)
      throw error
    }
  } else {
    setTimeout(() => {
      subscribeWhenReady(doctype, socket)
    }, 10)
  }
}

function isSecureURL(url) {
  const httpsRegexp = new RegExp(`^(https:/{2})`)
  return url.match(httpsRegexp)
}

function getDomainFromUrl(url) {
  try {
    return new URL(url).host
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Cannot get domain from URL : ${error.message}`)
    return null
  }
}

const isBoolean = [
  bool => typeof bool === 'undefined' || typeof bool === 'boolean',
  'should be a boolean'
]
const isRequired = [attr => !!attr, 'is required']
const isRequiredIfNo = keys => [
  (attr, obj) => keys.find(key => !!obj[key]) || !!attr,
  `is required if no attribute ${keys.join(' or ')} are provider.`
]
const isString = [
  str => typeof str === 'undefined' || typeof str === 'string',
  'should be a string'
]
const isURL = [
  url => {
    if (typeof url === 'undefined') return true
    try {
      new URL(url)
    } catch (error) {
      return false
    }

    return true
  },
  'should be an URL'
]

const validate = types => obj => {
  for (const [attr, rules] of Object.entries(types)) {
    for (const [validator, message] of rules) {
      if (!validator(obj[attr], obj)) {
        throw new Error(`${attr} ${message}.`)
      }
    }
  }
}

const configTypes = {
  domain: [isRequiredIfNo(['url']), isString],
  secure: [isBoolean],
  token: [isRequired, isString],
  url: [isRequiredIfNo(['domain']), isURL]
}

const validateConfig = validate(configTypes)

async function connectWebSocket(
  config,
  onmessage,
  onclose,
  numRetries,
  retryDelay
) {
  validateConfig(config)
  return new Promise((resolve, reject) => {
    const options = {
      secure: config.url ? isSecureURL(config.url) : true,
      ...config
    }

    const protocol = options.secure ? 'wss:' : 'ws:'
    const domain = options.domain || getDomainFromUrl(options.url)

    if (!domain) {
      throw new Error('Unable to detect domain')
    }

    const socket = new WebSocket(
      `${protocol}//${domain}/realtime/`,
      'io.cozy.websocket'
    )

    socket.onopen = () => {
      try {
        socket.send(
          JSON.stringify({
            method: 'AUTH',
            payload: options.token
          })
        )
      } catch (error) {
        return reject(error)
      }

      const windowUnloadHandler = () => socket.close()
      window.addEventListener('beforeunload', windowUnloadHandler)

      socket.onmessage = onmessage
      socket.onclose = event => {
        window.removeEventListener('beforeunload', windowUnloadHandler)
        if (typeof onclose === 'function')
          onclose(event, numRetries, retryDelay)
      }
      socket.onerror = error =>
        // eslint-disable-next-line no-console
        console.error(`WebSocket error: ${error.message}`)

      resolve(socket)
    }
  })
}

function getCozySocket(config) {
  return new Promise(async (resolve, reject) => {
    if (cozySocket) return resolve(cozySocket)

    const listeners = {}

    let socket

    const onSocketMessage = event => {
      const data = JSON.parse(event.data)
      const eventType = data.event.toLowerCase()
      const payload = data.payload

      if (eventType === 'error') {
        const realtimeError = new Error(payload.title)
        const errorFields = ['status', 'code', 'source']
        errorFields.forEach(property => {
          realtimeError[property] = payload[property]
        })

        throw realtimeError
      }

      if (listeners[payload.type] && listeners[payload.type][eventType]) {
        listeners[payload.type][eventType].forEach(listener => {
          listener(payload.doc)
        })
      }
    }

    const onSocketClose = async (event, numRetries, retryDelay) => {
      if (!event.wasClean) {
        // eslint-disable-next-line no-console
        console.warn(
          `WebSocket closed unexpectedly with code ${event.code} and ${
            event.reason ? `reason: '${event.reason}'` : 'no reason'
          }.`
        )

        if (numRetries) {
          // eslint-disable-next-line no-console
          console.warn(`Reconnecting ... ${numRetries} tries left.`)
          setTimeout(async () => {
            try {
              socket = await connectWebSocket(
                config,
                onSocketMessage,
                onSocketClose,
                --numRetries,
                retryDelay + 1000
              )
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error(
                `Unable to reconnect to realtime. Error: ${error.message}`
              )
            }
          }, retryDelay)
        }
      }
    }

    try {
      socket = await connectWebSocket(
        config,
        onSocketMessage,
        onSocketClose,
        NUM_RETRIES,
        RETRY_BASE_DELAY
      )
    } catch (error) {
      reject(error)
    }

    cozySocket = {
      subscribe: (doctype, event, listener) => {
        if (typeof listener !== 'function')
          throw new Error('Realtime event listener must be a function')

        if (!listeners[doctype]) {
          listeners[doctype] = {}
          subscribeWhenReady(doctype, socket)
        }

        listeners[doctype][event] = (listeners[doctype][event] || []).concat([
          listener
        ])
      },
      unsubscribe: (doctype, event, listener) => {
        if (
          listeners[doctype] &&
          listeners[doctype][event] &&
          listeners[doctype][event].includes(listener)
        ) {
          listeners[doctype][event] = listeners[doctype][event].filter(
            l => l !== listener
          )
        }
      }
    }

    resolve(cozySocket)
  })
}

// Returns the Promise of a subscription to a given doctype and document
export function subscribe(config, doctype, doc, parse = doc => doc) {
  return subscribeAll(config, doctype, parse).then(subscription => {
    // We will call the listener only for the given document, so let's curry it
    const docListenerCurried = listener => {
      return syncedDoc => {
        if (syncedDoc._id === doc._id) {
          listener(syncedDoc)
        }
      }
    }

    return {
      onUpdate: listener => subscription.onUpdate(docListenerCurried(listener)),
      onDelete: listener => subscription.onDelete(docListenerCurried(listener)),
      unsubscribe: () => subscription.unsubscribe()
    }
  })
}

// Returns the Promise of a subscription to a given doctype (all documents)
export function subscribeAll(config, doctype, parse = doc => doc) {
  return getCozySocket(config).then(cozySocket => {
    // Some document need to have specific parsing, for example, decoding
    // base64 encoded properties
    const parseCurried = listener => {
      return doc => {
        listener(parse(doc))
      }
    }

    let createListener, updateListener, deleteListener

    const subscription = {
      onCreate: listener => {
        createListener = parseCurried(listener)
        cozySocket.subscribe(doctype, 'created', createListener)
        return subscription
      },
      onUpdate: listener => {
        updateListener = parseCurried(listener)
        cozySocket.subscribe(doctype, 'updated', updateListener)
        return subscription
      },
      onDelete: listener => {
        deleteListener = parseCurried(listener)
        cozySocket.subscribe(doctype, 'deleted', deleteListener)
        return subscription
      },
      unsubscribe: () => {
        cozySocket.unsubscribe(doctype, 'created', createListener)
        cozySocket.unsubscribe(doctype, 'updated', updateListener)
        cozySocket.unsubscribe(doctype, 'deleted', deleteListener)
      }
    }

    return subscription
  })
}

export default {
  subscribeAll,
  subscribe
}
