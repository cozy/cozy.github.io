import fetch from 'node-fetch'
global.fetch = fetch

import CozyClient from 'cozy-client'
import { schema } from 'doctypes'
import { Document } from 'cozy-doctypes'

const assertEnvVar = varName => {
  if (!process.env[varName]) {
    throw new Error(`${varName} environment variable is not set`)
  }
}

// TODO Check to use CozyClient.fromEnv
export const runService = service => {
  assertEnvVar('COZY_URL')
  assertEnvVar('COZY_CREDENTIALS')

  const client = new CozyClient({
    uri: process.env.COZY_URL.trim(),
    schema,
    token: process.env.COZY_CREDENTIALS.trim()
  })
  Document.registerClient(client)

  return service({ client }).catch(e => {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  })
}
