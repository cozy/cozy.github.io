import { getClient } from './mobile'

// Mock otherwise we have a 'fetch is not defined' error
// due to pouchdb-browser. Here we are not concerned with this
// component
jest.mock('cozy-pouch-link', () => () => null)

describe('get mobile client', () => {
  it('should have plugins correctly instantiated', async () => {
    global.__APP_VERSION__ = '1.5.0'
    const client = await getClient()
    expect(client.plugins.push).not.toBeUndefined()
    expect(client.plugins.sentry).not.toBeUndefined()
  })
})
