import CozyClient from 'cozy-client'

import RealtimePlugin from './RealtimePlugin'

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
  expect(client.plugins.realtime.sendNotification).toBeInstanceOf(Function)
})

it('should login/logout correctly', async () => {
  client = new CozyClient({})
  client.registerPlugin(RealtimePlugin)

  const onLogin = jest.fn()
  const onLogout = jest.fn()
  client.on('plugin:realtime:login', onLogin)
  client.on('plugin:realtime:logout', onLogout)
  expect(client.plugins.realtime.realtime).toBeNull()
  await client.login({
    uri: 'http://cozy.tools:8080',
    token: 'fake-token'
  })
  expect(client.plugins.realtime.realtime).not.toBeNull()
  expect(onLogin).toHaveBeenCalledTimes(1)
  expect(onLogout).toHaveBeenCalledTimes(0)
  await client.logout()
  expect(client.plugins.realtime.realtime).toBeNull()
  expect(onLogin).toHaveBeenCalledTimes(1)
  expect(onLogout).toHaveBeenCalledTimes(1)
})

it('should pass the given createWebSocket function on login', async () => {
  const createWebSocket = jest.fn()

  client = new CozyClient({})
  client.registerPlugin(RealtimePlugin, { createWebSocket })

  await client.login({
    uri: 'http://cozy.tools:8080',
    token: 'fake-token'
  })
  expect(client.plugins.realtime.realtime).not.toBeNull()
  expect(client.plugins.realtime.createWebSocket).toBe(createWebSocket)
})

it('throws user friendly errors when trying to use the realtime while logged out', async () => {
  const errorMessage =
    'Unable to use realtime while cozy-client is not logged in'
  client = new CozyClient({})
  client.registerPlugin(RealtimePlugin)
  expect(() => client.plugins.realtime.subscribe()).toThrowError(errorMessage)
  expect(() => client.plugins.realtime.unsubscribe()).toThrowError(errorMessage)
  expect(() => client.plugins.realtime.unsubscribeAll()).toThrowError(
    errorMessage
  )

  await client.login({
    uri: 'http://cozy.tools:8080',
    token: 'fake-token'
  })
  expect(() => client.plugins.realtime.subscribe()).not.toThrowError(
    errorMessage
  )
  expect(() => client.plugins.realtime.unsubscribe()).not.toThrowError(
    errorMessage
  )
  expect(() => client.plugins.realtime.unsubscribeAll()).not.toThrowError(
    errorMessage
  )
})
