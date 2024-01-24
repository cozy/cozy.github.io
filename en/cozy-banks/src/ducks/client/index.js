import { Intents } from 'cozy-interapp'
import { RealtimePlugin } from 'cozy-realtime'

let client

const lib = require('./web')

export const getClient = async () => {
  if (client) {
    return client
  }

  client = await lib.getClient()

  const intents = new Intents({ client })
  client.intents = intents

  client.registerPlugin(RealtimePlugin)

  // Used as a hack to prevent circular dependency.
  // Some selectors need to access cozyClient to correctly hydrate.
  // That should change, hydratation should be possible to do only
  // with the store
  // See selectors/index.js
  window.cozyClient = client

  return client
}

export { default as CleanupStoreClientPlugin } from './cleanup'
export { default as StartupChecksPlugin } from './checks'
export * from './utils'
