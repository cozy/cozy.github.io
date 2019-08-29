import CozyClient from 'cozy-client'
import { schema } from 'doctypes'

const defaultOptions = {
  uri: 'http://cozy.works:8080',
  token: 'MyOwnToken'
}

export const getClient = ({ uri, token, fetchJSONReturn } = defaultOptions) => {
  const client = new CozyClient({
    schema,
    uri,
    token
  })
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
  return client
}

export default getClient
