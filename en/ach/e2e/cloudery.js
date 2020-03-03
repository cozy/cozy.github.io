const { assert } = require('./utils')
const request = require('request-promise-native')

const config = {
  clouderyURI: 'https://manager-dev.cozycloud.cc',
  clouderyToken: process.env.CLOUDERY_TOKEN
}

/**
 * Wrapper on request-promise-native for cloudery
 * Has predefined headers
 * Uses options.route instead of options.url since cloudery base URL
 * is already prepended
 */
const clouderyRequest = async requestOptions => {
  assert(
    config.clouderyToken,
    'Please provide CLOUDERY_TOKEN in environment variable'
  )
  try {
    const res = await request({
      url: config.clouderyURI + requestOptions.route,
      json: true,
      headers: {
        Authorization: 'Bearer ' + config.clouderyToken
      },
      ...requestOptions
    })
    return res
  } catch (e) {
    console.error(e)
    const err = new Error('Cloudery request failed: ' + e.message)
    throw err
  }
}

const deleteInstance = async uuid => {
  const resp = await clouderyRequest({
    method: 'DELETE',
    route: '/api/v1/instances/' + uuid
  })
  return resp
}

const fetchInstanceInfo = async uuid => {
  const resp = await clouderyRequest({
    route: '/api/v1/instances/' + uuid,
    method: 'GET'
  })
  return resp
}

const createInstance = async creationOptions => {
  const resp = await clouderyRequest({
    route: '/api/v1/instances',
    method: 'POST',
    jar: false,
    body: {
      account: creationOptions.account,
      domain: creationOptions.domain,
      email: creationOptions.email,
      offer: creationOptions.offer,
      slug: creationOptions.slug,
      use_tracker: creationOptions.use_tracker
    }
  })
  return resp
}

module.exports = {
  createInstance,
  deleteInstance,
  fetchInstanceInfo
}
