import { Server } from 'mock-socket'

import __RewireAPI__, { createWebSocket, getSocket } from '../src/index'

const MOCK_SERVER_DOMAIN = 'localhost:8880'

const REALTIME_URL = `ws://${MOCK_SERVER_DOMAIN}/realtime/`
const REALTIME_URL_SECURE = `wss://${MOCK_SERVER_DOMAIN}/realtime/`

let server
let mockSubscribe = jest.fn()
jest.useFakeTimers() // mock-socket use timers to delay onopen call
describe('(cozy-realtime) createWebSocket: ', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    __RewireAPI__.__Rewire__('subscribeWhenReady', mockSubscribe)
    __RewireAPI__.__Rewire__('socketPromise', null)
    server = new Server(REALTIME_URL)
  })

  afterEach(() => {
    jest.runAllTimers()
    __RewireAPI__.__ResetDependency__('subscribeWhenReady')
    __RewireAPI__.__ResetDependency__('socketPromise')
    server.stop()
  })

  it('socket should create a global socket promise with provided domain and secure option', async () => {
    const mockConfig = {
      domain: MOCK_SERVER_DOMAIN,
      secure: false,
      token: 'blablablatoken'
    }

    createWebSocket(mockConfig, jest.fn(), jest.fn(), 10, 2000)
    jest.runAllTimers()
    expect(await getSocket()).toMatchSnapshot()
  })

  it('socket should create a global socket handling wss', async () => {
    server.stop()
    server = new Server(REALTIME_URL_SECURE)
    const mockConfig = {
      domain: MOCK_SERVER_DOMAIN,
      secure: true,
      token: 'blablablatoken'
    }

    createWebSocket(mockConfig, jest.fn(), jest.fn(), 10, 2000)
    jest.runAllTimers()
    expect(await getSocket()).toMatchSnapshot()
  })

  it('socket should throw error if no url or domain provided', () => {
    const mockConfig = {
      secure: false,
      token: 'blablablatoken'
    }

    expect(() => {
      createWebSocket(mockConfig, jest.fn(), jest.fn(), 10, 2000)
      jest.runAllTimers()
    }).toThrowErrorMatchingSnapshot()
  })

  it('socket should throw error if wrong url format provided', () => {
    const mockConfig = {
      url: 'blable.bla:blabla',
      secure: false,
      token: 'blablablatoken'
    }

    expect(() => {
      createWebSocket(mockConfig, jest.fn(), jest.fn(), 10, 2000)
      jest.runAllTimers()
    }).toThrowErrorMatchingSnapshot()
  })

  it('socket should throw error if wrong url type provided', () => {
    const mockConfig = {
      url: () => {},
      secure: false,
      token: 'blablablatoken'
    }

    expect(() => {
      createWebSocket(mockConfig, jest.fn(), jest.fn(), 10, 2000)
      jest.runAllTimers()
    }).toThrowErrorMatchingSnapshot()
  })

  it('socket should handle authenticating on socket open', async () => {
    const mockConfig = {
      domain: MOCK_SERVER_DOMAIN,
      secure: false,
      token: 'blablablatoken'
    }
    const sentMessages = []
    server.on('connection', socket => {
      socket.on('message', data => sentMessages.push(data))
    })

    createWebSocket(mockConfig, jest.fn(), jest.fn(), 10, 2000)
    jest.runAllTimers()
    expect(sentMessages.length).toBe(1)
    expect(JSON.parse(sentMessages[0]).payload).toBe(mockConfig.token)
    expect(JSON.parse(sentMessages[0])).toMatchSnapshot()
  })

  it('socket should warn errors on socket errors', () => {
    const mockConfig = {
      domain: MOCK_SERVER_DOMAIN,
      secure: false,
      token: 'blablablatoken'
    }
    console.error = jest.fn()

    createWebSocket(mockConfig, jest.fn(), jest.fn(), 10, 2000)
    jest.runAllTimers()
    // simulate onerror
    expect(() => {
      server.simulate('error')
    }).not.toThrowError()
    expect(console.error.mock.calls.length).toBe(1)
    expect(console.error.mock.calls[0][0]).toMatchSnapshot()
    console.error.mockRestore()
  })

  it('socket should handle message', () => {
    const mockConfig = {
      domain: MOCK_SERVER_DOMAIN,
      secure: false,
      token: 'blablablatoken'
    }
    const onMessageMock = jest.fn()

    createWebSocket(mockConfig, onMessageMock, jest.fn(), 10, 2000)
    jest.runAllTimers()
    // simulate a message
    server.emit('message', 'a server message to socket')
    expect(onMessageMock.mock.calls.length).toBe(1)
    onMessageMock.mock.calls[0][0].timeStamp = 0 // reset timestamp for snapshot
    expect(onMessageMock.mock.calls[0][0]).toMatchSnapshot()
  })

  it('socket should handle closing server', () => {
    const mockConfig = {
      domain: MOCK_SERVER_DOMAIN,
      secure: false,
      token: 'blablablatoken'
    }
    const onCloseMock = jest.fn()
    jest.spyOn(window, 'removeEventListener')

    createWebSocket(mockConfig, jest.fn(), onCloseMock, 10, 2000)
    jest.runAllTimers()
    server.close()
    expect(onCloseMock.mock.calls.length).toBe(1)
    expect(window.removeEventListener.mock.calls.length).toBe(1)
    onCloseMock.mock.calls[0][0].timeStamp = 0 // reset timestamp for snapshot
    expect(onCloseMock.mock.calls[0][0]).toMatchSnapshot()
  })

  it('socket should handle closing server even if no onclose function provided', () => {
    const mockConfig = {
      domain: MOCK_SERVER_DOMAIN,
      secure: false,
      token: 'blablablatoken'
    }

    createWebSocket(mockConfig, jest.fn(), null, 10, 2000)
    jest.runAllTimers()
    server.close()
    expect(window.removeEventListener.mock.calls.length).toBe(1)
  })

  it('socket should close the socket on unloading window', async () => {
    const mockConfig = {
      domain: MOCK_SERVER_DOMAIN,
      secure: false,
      token: 'blablablatoken'
    }

    createWebSocket(mockConfig, jest.fn(), jest.fn(), 10, 2000)
    jest.runAllTimers()
    const cozySocket = await getSocket()
    expect(cozySocket.readyState).toBe(1) // OPENED
    window.dispatchEvent(new Event('beforeunload'))
    expect(cozySocket.readyState).toBe(2) // CLOSING
    jest.runAllTimers()
    expect(cozySocket.readyState).toBe(3) // CLOSED
  })
})
