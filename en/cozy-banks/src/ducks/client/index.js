/* global __DEV__, __TARGET__ */
import { Intents } from 'cozy-interapp'

let client

const lib =
  __TARGET__ === 'mobile' ? require('./mobile/mobile') : require('./web')

export const getClient = () => {
  if (client) {
    return client
  }

  client = lib.getClient()

  const intents = new Intents({ client })
  client.intents = intents

  if (__DEV__) {
    window.cozyClient = client
  }

  return client
}
