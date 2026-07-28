// helper to serialize/deserialize an error for/from postMessage
export const errorSerializer = (() => {
  const mapErrorProperties = (from, to) => {
    const result = Object.assign(to, from)
    const nativeProperties = ['name', 'message']
    return nativeProperties.reduce((result, property) => {
      if (from[property]) {
        to[property] = from[property]
      }
      return result
    }, result)
  }
  return {
    serialize: error => mapErrorProperties(error, {}),
    deserialize: data => mapErrorProperties(data, new Error(data.message))
  }
})()

/**
 *
 * Returns the first service from the services in the intent.
 * Throws if service not found.
 *
 * If filterServices is passed, the first service matching filterServices
 * is returned.
 *
 * In the future, users will have to pick the desired service from a list.
 *
 */
export const pickService = (intent, filterServices) => {
  const services = intent.attributes.services || []
  const service = filterServices ? services.find(filterServices) : services[0]
  if (!service) {
    throw new Error('Unable to find a service')
  }
  return service
}

export const buildRedirectionURL = (url, data) => {
  const isSerializable = value => !['object', 'function'].includes(typeof value)

  const parameterStrings = Object.keys(data)
    .filter(key => isSerializable(data[key]))
    .map(key => `${key}=${data[key]}`)

  return parameterStrings.length ? `${url}?${parameterStrings.join('&')}` : url
}

export const removeQueryString = url => url.replace(/\?[^/#]*/, '')
