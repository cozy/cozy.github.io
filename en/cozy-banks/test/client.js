import CozyClient from 'cozy-client'
import { schema } from 'doctypes'

const defaultOptions = {
  uri: 'http://cozy.works:8080',
  token: 'MyOwnToken'
}

export const mkFakeChain = () => ({
  request: jest.fn().mockReturnValue({ data: [] })
})

export const getClient = ({ uri, token, fetchJSONReturn } = defaultOptions) => {
  const client = new CozyClient({
    schema,
    uri,
    token
  })
  client.ensureStore()
  if (fetchJSONReturn) {
    client.client.fetchJSON = jest.fn().mockReturnValue(fetchJSONReturn)
  }
  client.intents = {
    create: () => {
      return {
        start: () => Promise.resolve()
      }
    }
  }
  client.chain = mkFakeChain()
  client.plugins.realtime = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
  }
  return client
}

export default getClient
