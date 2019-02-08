import __RewireAPI__, * as cozyRealtime from '../src/index'

const mockConfig = {
  domain: 'cozy.tools:8080',
  secure: false,
  token: 'blablablatoken'
}

describe('(cozy-realtime) cozySocket handling and initCozySocket: ', () => {
  let mockConnect = jest.fn()
  let mockSendSubscribe = jest.fn()
  jest.useFakeTimers()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    // reset timeouts
    jest.runAllTimers()
    // rewire the internal functions usage
    __RewireAPI__.__Rewire__('createWebSocket', mockConnect)
    __RewireAPI__.__Rewire__('subscribeWhenReady', mockSendSubscribe)
    __RewireAPI__.__Rewire__(
      'socketPromise',
      Promise.resolve(new WebSocket('ws://mock.tools'))
    )
    __RewireAPI__.__Rewire__('cozySocket', {
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    })
  })

  afterEach(() => {
    __RewireAPI__.__ResetDependency__('createWebSocket')
    __RewireAPI__.__ResetDependency__('subscribeWhenReady')
    __RewireAPI__.__ResetDependency__('socketPromise')
    __RewireAPI__.__ResetDependency__('cozySocket')
  })

  it('initCozySocket should call createWebSocket with correct config and arguments', () => {
    // rewire the internal createWebSocket usage
    cozyRealtime.initCozySocket(mockConfig)
    expect(mockConnect.mock.calls.length).toBe(1)
    expect(mockSendSubscribe.mock.calls.length).toBe(0)
    expect(mockConnect.mock.calls[0]).toMatchSnapshot()
  })

  it('initCozySocket should define a global configured cozy socket', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    expect(cozySocket).toMatchSnapshot()
  })

  it('cozySocket should not send socket message, add doctype listener and state multiple times if this is the same doctype', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    // we have to keep a reference for each listener for subscribing/unsubscribing
    const mockCreatedListener = jest.fn()
    const mockUpdatedListener = jest.fn()
    const mockDeletedListener = jest.fn()
    cozySocket.subscribe('io.cozy.mocks', 'created', mockCreatedListener)
    cozySocket.subscribe('io.cozy.mocks', 'updated', mockUpdatedListener)
    cozySocket.subscribe('io.cozy.mocks', 'deleted', mockDeletedListener)
    expect(mockSendSubscribe.mock.calls.length).toBe(1)
    expect(cozyRealtime.getListeners().size).toBe(1)
    expect(cozyRealtime.getListeners()).toMatchSnapshot()
    // reset
    cozySocket.unsubscribe('io.cozy.mocks', 'created', mockCreatedListener)
    cozySocket.unsubscribe('io.cozy.mocks', 'updated', mockUpdatedListener)
    cozySocket.unsubscribe('io.cozy.mocks', 'deleted', mockDeletedListener)
  })

  it('cozySocket should send socket message and add state multiple times if this is the different doctypes', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    // we have to keep a reference for each listener for subscribing/unsubscribing
    const mockCreatedListener = jest.fn()
    const mockUpdatedListener = jest.fn()
    const mockDeletedListener = jest.fn()
    cozySocket.subscribe('io.cozy.mocks', 'created', mockCreatedListener)
    cozySocket.subscribe('io.cozy.mocks2', 'updated', mockUpdatedListener)
    cozySocket.subscribe('io.cozy.mocks3', 'deleted', mockDeletedListener)
    expect(mockSendSubscribe.mock.calls.length).toBe(3)
    expect(cozyRealtime.getListeners().size).toBe(3)
    expect(cozyRealtime.getListeners()).toMatchSnapshot()
    // reset
    cozySocket.unsubscribe('io.cozy.mocks', 'created', mockCreatedListener)
    cozySocket.unsubscribe('io.cozy.mocks2', 'updated', mockUpdatedListener)
    cozySocket.unsubscribe('io.cozy.mocks3', 'deleted', mockDeletedListener)
  })

  it('cozySocket should send socket message and add state multiple times if this is different doc ids', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    // we have to keep a reference for each listener for subscribing/unsubscribing
    const mockUpdatedListener = jest.fn()
    const mockUpdatedListener2 = jest.fn()
    cozySocket.subscribe(
      'io.cozy.mocks',
      'updated',
      mockUpdatedListener,
      'id1234'
    )
    cozySocket.subscribe(
      'io.cozy.mocks',
      'updated',
      mockUpdatedListener2,
      'id5678'
    )
    expect(mockSendSubscribe.mock.calls.length).toBe(2)
    expect(cozyRealtime.getListeners().size).toBe(2)
    expect(cozyRealtime.getListeners()).toMatchSnapshot('listeners')
    // reset
    cozySocket.unsubscribe(
      'io.cozy.mocks',
      'updated',
      mockUpdatedListener,
      'id1234'
    )
    cozySocket.unsubscribe(
      'io.cozy.mocks',
      'updated',
      mockUpdatedListener2,
      'id5678'
    )
  })

  it('cozySocket should remove doctype listener from listeners on unsubscribe', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    // we have to keep a reference for each listener for subscribing/unsubscribing
    const mockCreatedListener = jest.fn()
    const mockUpdatedListener = jest.fn()
    cozySocket.subscribe('io.cozy.mocks', 'created', mockCreatedListener)
    cozySocket.subscribe(
      'io.cozy.mocks2',
      'updated',
      mockUpdatedListener,
      'id1234'
    )
    expect(mockSendSubscribe.mock.calls.length).toBe(2)
    expect(cozyRealtime.getListeners().size).toBe(2)
    cozySocket.unsubscribe('io.cozy.mocks', 'created', mockCreatedListener)
    cozySocket.unsubscribe(
      'io.cozy.mocks2',
      'updated',
      mockUpdatedListener,
      'id1234'
    )
  })

  it('cozySocket should remove doctype listener from listeners only if there are no more remaining listeners', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    // we have to keep a reference for each listener for subscribing/unsubscribing
    const mockCreatedListener = jest.fn()
    const mockUpdatedListener = jest.fn()
    cozySocket.subscribe('io.cozy.mocks', 'created', mockCreatedListener)
    cozySocket.subscribe('io.cozy.mocks', 'updated', mockUpdatedListener)
    expect(cozyRealtime.getListeners().size).toBe(1)
    cozySocket.unsubscribe('io.cozy.mocks', 'created', mockCreatedListener)
    expect(cozyRealtime.getListeners().size).toBe(1)
    cozySocket.unsubscribe('io.cozy.mocks', 'updated', mockUpdatedListener)
    expect(cozyRealtime.getListeners().size).toBe(0)
  })

  it('cozySocket should not throw any error if we unsubscribe not subscribed doctype', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    // we have to keep a reference for each listener for subscribing/unsubscribing
    const mockCreatedListener = jest.fn()
    cozySocket.subscribe('io.cozy.mocks', 'created', mockCreatedListener)
    expect(mockSendSubscribe.mock.calls.length).toBe(1)
    expect(cozyRealtime.getListeners().size).toBe(1)
    expect(() => {
      cozySocket.unsubscribe('io.cozy.mocks2', 'updated', mockCreatedListener)
    }).not.toThrowError()
    expect(mockSendSubscribe.mock.calls.length).toBe(1)
    expect(cozyRealtime.getListeners().size).toBe(1)
    // reset
    cozySocket.unsubscribe('io.cozy.mocks', 'created', mockCreatedListener)
  })

  it('cozySocket should throw an error if the listener provided is not a function', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    expect(() => {
      cozySocket.subscribe('io.cozy.mocks', 'updated', 'notAFunction')
    }).toThrowErrorMatchingSnapshot()
    expect(mockSendSubscribe.mock.calls.length).toBe(0)
    expect(cozyRealtime.getListeners().size).toBe(0)
  })

  it('cozySocket should throw an error if the socket connexion throwed an error', () => {
    const mockError = new Error('expected socket error')
    const mockConnect = jest.fn(() => {
      throw mockError
    })
    __RewireAPI__.__Rewire__('createWebSocket', mockConnect)
    expect(() => {
      cozyRealtime.initCozySocket(mockConfig)
    }).toThrowError(mockError)
    expect(mockSendSubscribe.mock.calls.length).toBe(0)
    expect(cozyRealtime.getListeners().size).toBe(0)
  })

  it('onSocketMessage provided by initCozySocket to createWebSocket should throw error if eventType error', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const onSocketMessage = mockConnect.mock.calls[0][1]
    expect(() => {
      onSocketMessage({
        data: JSON.stringify({
          event: 'ERROR',
          payload: {
            title: 'expected realtime error'
          }
        })
      })
    }).toThrowErrorMatchingSnapshot()
  })

  it('onSocketMessage provided by initCozySocket to createWebSocket should call provided listener if matched event received', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    const onSocketMessage = mockConnect.mock.calls[0][1]
    const mockDoc = {
      _id: 'mockId',
      name: 'Mock'
    }
    // create listener and add it to a subscription
    const mockListener = jest.fn()
    cozySocket.subscribe('io.cozy.mocks', 'created', mockListener)
    onSocketMessage({
      data: JSON.stringify({
        event: 'CREATED',
        payload: {
          type: 'io.cozy.mocks',
          id: mockDoc._id,
          doc: mockDoc
        }
      })
    })
    expect(mockListener.mock.calls.length).toBe(1)
    expect(mockListener.mock.calls[0][0]).toEqual(mockDoc)
    // reset
    cozySocket.unsubscribe('io.cozy.mocks', 'created', mockListener)
  })

  it('onSocketMessage provided by initCozySocket to createWebSocket should not call provided listener if wrong event received', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    const onSocketMessage = mockConnect.mock.calls[0][1]
    const mockDoc = {
      _id: 'mockId',
      name: 'Mock'
    }
    // create listener and add it to a subscription
    const mockListener = jest.fn()
    cozySocket.subscribe('io.cozy.mocks', 'created', mockListener)
    onSocketMessage({
      data: JSON.stringify({
        event: 'DELETED',
        payload: {
          type: 'io.cozy.mocks',
          id: mockDoc._id,
          doc: mockDoc
        }
      })
    })
    expect(mockListener.mock.calls.length).toBe(0)
    // reset
    cozySocket.unsubscribe('io.cozy.mocks', 'created', mockListener)
  })

  it('onSocketMessage provided by initCozySocket to createWebSocket should not call provided listener if wrong doctype received', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    const onSocketMessage = mockConnect.mock.calls[0][1]
    const mockDoc = {
      _id: 'mockId',
      name: 'Mock'
    }
    // create listener and add it to a subscription
    const mockListener = jest.fn()
    cozySocket.subscribe('io.cozy.mocks', 'created', mockListener)
    onSocketMessage({
      data: JSON.stringify({
        event: 'CREATED',
        payload: {
          type: 'io.cozy.mocks2',
          id: mockDoc._id,
          doc: mockDoc
        }
      })
    })
    expect(mockListener.mock.calls.length).toBe(0)
    // reset
    cozySocket.unsubscribe('io.cozy.mocks', 'created', mockListener)
  })

  it('onSocketMessage provided by initCozySocket to createWebSocket should handle payload wihout id', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    const onSocketMessage = mockConnect.mock.calls[0][1]
    const mockDoc = {
      _id: 'mockId',
      name: 'Mock'
    }
    // create listener and add it to a subscription
    const mockListener = jest.fn()
    cozySocket.subscribe('io.cozy.mocks', 'updated', mockListener)
    onSocketMessage({
      data: JSON.stringify({
        event: 'UPDATED',
        payload: {
          type: 'io.cozy.mocks',
          doc: mockDoc
        }
      })
    })
    expect(mockListener.mock.calls.length).toBe(1)
    expect(mockListener.mock.calls[0][0]).toEqual(mockDoc)
    // reset
    cozySocket.unsubscribe('io.cozy.mocks', 'updated', mockListener)
  })

  it('onSocketMessage provided by initCozySocket to createWebSocket should call all listeners with correct docId provided', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const cozySocket = cozyRealtime.getCozySocket()
    const onSocketMessage = mockConnect.mock.calls[0][1]
    const mockDoc = {
      _id: 'mockId',
      name: 'Mock'
    }
    // create listener and add it to a subscription
    const mockListener = jest.fn()
    const mockDocListener = jest.fn()
    cozySocket.subscribe('io.cozy.mocks', 'updated', mockListener)
    cozySocket.subscribe(
      'io.cozy.mocks',
      'updated',
      mockDocListener,
      mockDoc._id
    )
    onSocketMessage({
      data: JSON.stringify({
        event: 'UPDATED',
        payload: {
          type: 'io.cozy.mocks',
          id: mockDoc._id,
          doc: mockDoc
        }
      })
    })
    expect(mockListener.mock.calls.length).toBe(1)
    expect(mockListener.mock.calls[0][0]).toEqual(mockDoc)
    expect(mockDocListener.mock.calls.length).toBe(1)
    expect(mockDocListener.mock.calls[0][0]).toEqual(mockDoc)
    // reset
    cozySocket.unsubscribe('io.cozy.mocks', 'created', mockListener)
  })

  it('onSocketClose provided by initCozySocket to createWebSocket should do nothing if event.wasClean', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const onSocketClose = mockConnect.mock.calls[0][2]
    // reset the mock state to remove the initCozySocket usage
    mockConnect.mockReset()
    onSocketClose({
      wasClean: true
    })
    expect(mockConnect.mock.calls.length).toBe(0)
  })

  it('onSocketClose provided by initCozySocket to createWebSocket should remove the global socket/cozySocket if it exists at the end of retries', async () => {
    cozyRealtime.initCozySocket(mockConfig)
    const onSocketClose = mockConnect.mock.calls[0][2]
    // reset the mock state to remove the initCozySocket usage
    mockConnect.mockReset()
    console.warn = jest.fn()
    console.error = jest.fn()
    onSocketClose(
      {
        wasClean: false,
        code: 0
      },
      1,
      100
    )
    expect(console.warn.mock.calls.length).toBe(2)
    expect(console.error.mock.calls.length).toBe(0)
    console.warn.mockClear()
    console.error.mockClear()
    expect(await cozyRealtime.getCozySocket()).toBeInstanceOf(Object)
    expect(await cozyRealtime.getSocket()).toBeInstanceOf(WebSocket)
    jest.runAllTimers()
    onSocketClose({
      wasClean: false,
      code: 0,
      reason: 'expected test close reason'
    })
    jest.runAllTimers()
    expect(await cozyRealtime.getCozySocket()).toBeNull()
    expect(await cozyRealtime.getSocket()).toBeNull()
    expect(mockConnect.mock.calls.length).toBe(1)
    // 2 warns each
    expect(console.warn.mock.calls.length).toBe(1)
    expect(console.error.mock.calls.length).toBe(1)
    console.warn.mockRestore()
    console.error.mockRestore()
  })

  it('onSocketClose provided by initCozySocket to createWebSocket should just warn if !event.wasClean without retries provided', () => {
    cozyRealtime.initCozySocket(mockConfig)
    const onSocketClose = mockConnect.mock.calls[0][2]
    // reset the mock state to remove the initCozySocket usage
    mockConnect.mockReset()
    console.warn = jest.fn()
    console.error = jest.fn()
    onSocketClose({
      wasClean: false,
      code: 0
    })
    expect(console.warn.mock.calls.length).toBe(1)
    expect(console.error.mock.calls.length).toBe(1)
    console.warn.mockClear()
    console.error.mockClear()
    onSocketClose({
      wasClean: false,
      code: 0,
      reason: 'expected test close reason'
    })
    expect(console.warn.mock.calls.length).toBe(1)
    expect(console.error.mock.calls.length).toBe(1)
    expect(mockConnect.mock.calls.length).toBe(0)
    // reset
    console.warn.mockRestore()
    console.error.mockRestore()
  })

  it('onSocketClose provided by initCozySocket to createWebSocket should retry according to retries provided and !event.wasClean (empty listeners state)', () => {
    const RETRIES = 2
    cozyRealtime.initCozySocket(mockConfig)
    const onSocketClose = mockConnect.mock.calls[0][2]
    __RewireAPI__.__Rewire__('listeners', new Map())
    let numRetries = RETRIES
    // reset the mock state to remove the initCozySocket usage
    mockConnect.mockReset()
    onSocketClose(
      {
        wasClean: false,
        code: 0,
        reason: 'expected test close reason'
      },
      numRetries,
      200
    )
    jest.runOnlyPendingTimers()
    const onSocketClose2 = mockConnect.mock.calls[0][2]
    numRetries--
    onSocketClose2(
      {
        wasClean: false,
        code: 0,
        reason: 'expected test close reason'
      },
      numRetries,
      200
    )
    jest.runOnlyPendingTimers()
    // since we have 2 retries here, it shouldn't call createWebSocket
    // after this next socket closing
    const onSocketClose3 = mockConnect.mock.calls[0][2]
    numRetries--
    onSocketClose3(
      {
        wasClean: false,
        code: 0,
        reason: 'expected test close reason'
      },
      numRetries,
      200
    )
    jest.runOnlyPendingTimers()
    expect(mockConnect.mock.calls.length).toBe(RETRIES)
    expect(mockSendSubscribe.mock.calls.length).toBe(
      RETRIES * cozyRealtime.getListeners().size
    )
    __RewireAPI__.__ResetDependency__('listeners')
  })

  it('onSocketClose provided by initCozySocket to createWebSocket should retry according to retries provided and !event.wasClean (with listeners state)', () => {
    const RETRIES = 2
    cozyRealtime.initCozySocket(mockConfig)
    const onSocketClose = mockConnect.mock.calls[0][2]
    __RewireAPI__.__Rewire__(
      'listeners',
      new Map([
        ['io.cozy.mocks', { created: jest.fn() }],
        ['io.cozy.mocks2/id1234', { updated: jest.fn() }]
      ])
    )
    let numRetries = RETRIES
    // reset the mock state to remove the initCozySocket usage
    mockConnect.mockReset()
    onSocketClose(
      {
        wasClean: false,
        code: 0,
        reason: 'expected test close reason'
      },
      numRetries,
      200
    )
    jest.runOnlyPendingTimers()
    const onSocketClose2 = mockConnect.mock.calls[0][2]
    numRetries--
    onSocketClose2(
      {
        wasClean: false,
        code: 0,
        reason: 'expected test close reason'
      },
      numRetries,
      200
    )
    jest.runOnlyPendingTimers()
    // since we have 2 retries here, it shouldn't call createWebSocket
    // after this next socket closing
    const onSocketClose3 = mockConnect.mock.calls[0][2]
    numRetries--
    onSocketClose3(
      {
        wasClean: false,
        code: 0,
        reason: 'expected test close reason'
      },
      numRetries,
      200
    )
    jest.runOnlyPendingTimers()
    expect(mockConnect.mock.calls.length).toBe(RETRIES)
    expect(mockSendSubscribe.mock.calls.length).toBe(
      RETRIES * cozyRealtime.getListeners().size
    )
    // all retried subscriptions must be the same since the listeners
    // didn't change here
    let retriedSubscriptions = []
    for (let i = 0; i < mockSendSubscribe.mock.calls.length; i += RETRIES) {
      retriedSubscriptions.push(
        mockSendSubscribe.mock.calls.splice(
          0,
          mockSendSubscribe.mock.calls.length / RETRIES
        )
      )
    }
    retriedSubscriptions.forEach(subscriptions => {
      expect(subscriptions).toEqual(retriedSubscriptions[0])
    })
    expect(retriedSubscriptions[0]).toMatchSnapshot()
    __RewireAPI__.__ResetDependency__('listeners')
  })

  it('onSocketClose provided by initCozySocket to createWebSocket should handle error from a retry createWebSocket with an error message', () => {
    const mockError = new Error('expected socket retry error')
    cozyRealtime.initCozySocket(mockConfig)
    const onSocketClose = mockConnect.mock.calls[0][2]
    // reset the mock state to remove the initCozySocket usage
    const mockConnectWithError = jest.fn(() => {
      throw mockError
    })
    __RewireAPI__.__Rewire__('createWebSocket', mockConnectWithError)
    console.error = jest.fn()
    expect(() => {
      onSocketClose(
        {
          wasClean: false,
          code: 0,
          reason: 'expected test close reason'
        },
        1,
        200
      )
    }).not.toThrowError()
    jest.runAllTimers()
    expect(mockConnect.mock.calls.length).toBe(1)
    expect(console.error.mock.calls.length).toBe(1)
    expect(console.error.mock.calls[0][0]).toMatchSnapshot()
    // reset
    console.error.mockRestore()
  })
})
