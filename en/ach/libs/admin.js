const { URLSearchParams } = require('url')
const fetch = require('node-fetch')
const { getAdminConfigForDomain } = require('./config')

// Required since we use a self signed certificate
const https = require('https')
const agent = new https.Agent({
  rejectUnauthorized: false
})

/**
 * Base fetch to talk with admin endpoints
 * Deals with base URL, authentication and headers
 */
const baseFetch = (domain, route, options) => {
  const { adminAuth, adminURL } = getAdminConfigForDomain(domain)
  const auth = Buffer(adminAuth).toString('base64')
  const url = `${adminURL}${route}`
  const allOptions = {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    },
    agent
  }
  return fetch(url, allOptions).then(async resp => {
    if (resp.status !== 200) {
      throw resp
    } else {
      return resp
    }
  })
}

const createToken = (domain, doctypes) => {
  const params = new URLSearchParams({
    Domain: domain,
    Audience: 'cli',
    Scope: doctypes.join(' ')
  })
  return baseFetch(domain, `/instances/token?${params}`, {
    method: 'POST'
  }).then(resp => resp.text())
}

module.exports = {
  createToken
}
