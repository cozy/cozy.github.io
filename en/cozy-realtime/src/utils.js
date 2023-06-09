import has from 'lodash/has'

import defaultLogger from './logger'

/**
 * If the current context is a browser context
 * @type {string}
 */
export const hasBrowserContext = typeof window !== 'undefined'

/**
 * The cozy Realtime doctype
 * @type {string}
 */
export const doctype = 'io.cozy.websocket'

/**
 * Returns if the navigator is online
 *
 * @returns {boolean} true if online or unknown
 */
export function isOnline() {
  const hasOnline = has(global, 'navigator.onLine')
  return hasOnline ? global.navigator.onLine : true
}

/**
 * Returns if the current instance URL is secure (HTTPS)
 *
 * @private
 * @param {string|URL} url
 * @returns {boolean}
 */
function isSecureUrl(url) {
  return url.toString().match(`^(https:/{2})`)
}

/**
 * Get the instance URI from a cozy-client instance
 *
 * @private
 * @param {CozyClient}  client - CozyClient instance
 * @return {string} Instance url
 */
function getInstanceUri(client) {
  return client.getStackClient().uri
}

/**
 * Return websocket url from cozyClient
 *
 * @param {CozyClient} client - CozyClient instance
 * @return {string} WebSocket url
 */
export function getUrl(client) {
  const url = getInstanceUri(client)
  const protocol = isSecureUrl(url) ? 'wss:' : 'ws:'
  const host = new URL(url).host
  return `${protocol}//${host}/realtime/`
}

/**
 * Get the authorization token from cozy-client
 *
 * @param {CozyClient} client - CozyClient instance
 * @return {string} authorization token
 */
export function getToken(client) {
  return client.getStackClient().getAccessToken()
}

/**
 * Get the cozy-client instance from an options object
 *
 * This function is here for compatibility with old calling
 * code that may use a `cozyClient` property instead of the `client` one.
 *
 * @param {object} options
 * @param {CozyClient} client - a cozy client instance
 * @param {CozyClient} cozyClient - deprecated, a cozy client instance
 * @returns {CozyClient}
 */
export function getCozyClientFromOptions({
  cozyClient,
  client,
  logger = defaultLogger
}) {
  if (cozyClient) {
    logger.warn(
      'Passing a `cozyClient` parameter is deprecated, please use `client` instead'
    )
  } else if (!client) {
    logger.warn(
      'Realtime must be initialized with a client. Ex: `new Realtime({ client })`'
    )
  }
  return client || cozyClient
}

export function createWebSocket(url, doctype) {
  return new WebSocket(url, doctype)
}
