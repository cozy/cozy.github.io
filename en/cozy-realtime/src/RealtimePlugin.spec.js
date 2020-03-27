import RealtimePlugin from './RealtimePlugin'
import CozyClient from 'cozy-client'

let client

beforeEach(() => {
  client = new CozyClient({
    uri: 'http://cozy.tools:8080',
    token: 'fake-token'
  })
})

it('should attach to the client under the `realtime` plugin name', () => {
  expect(client.plugins.realtime).toBeUndefined()
  client.registerPlugin(RealtimePlugin)
  expect(client.plugins.realtime).toBeInstanceOf(RealtimePlugin)
})

it('should expose the same API as CozyRealtime', () => {
  client.registerPlugin(RealtimePlugin)
  expect(client.plugins.realtime.subscribe).toBeInstanceOf(Function)
  expect(client.plugins.realtime.unsubscribe).toBeInstanceOf(Function)
  expect(client.plugins.realtime.unsubscribeAll).toBeInstanceOf(Function)
})

it('should login/logout correctly', async () => {
  client = new CozyClient({})
  client.registerPlugin(RealtimePlugin)
  expect(client.plugins.realtime.realtime).toBeNull()
  await client.login({
    uri: 'http://cozy.tools:8080',
    token: 'fake-token'
  })
  expect(client.plugins.realtime.realtime).not.toBeNull()
  await client.logout()
  expect(client.plugins.realtime.realtime).toBeNull()
})
