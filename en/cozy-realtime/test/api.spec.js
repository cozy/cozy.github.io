import __RewireAPI__, { subscribe } from '../src/index'

const MOCK_SERVER_DOMAIN = 'localhost:8880'

let mockInitSocket = jest.fn(() => {
  __RewireAPI__.__Rewire__('cozySocket', {
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
  })
})

const mockConfig = {
  domain: MOCK_SERVER_DOMAIN,
  secure: false,
  token: 'blablablatoken'
}

describe('(cozy-realtime) API: ', () => {
  describe('subscribe all docs:', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetModules()
      __RewireAPI__.__Rewire__('initCozySocket', mockInitSocket)
      // reset cozySocket global variable
      __RewireAPI__.__Rewire__('cozySocket', null)
    })

    afterEach(() => {
      __RewireAPI__.__ResetDependency__('initCozySocket')
      __RewireAPI__.__ResetDependency__('cozySocket')
    })

    it('should call only once initCozySocket to avoid duplicating socket', () => {
      subscribe(mockConfig, 'io.cozy.mocks')
      subscribe(mockConfig, 'io.cozy.mocks2')
      subscribe(mockConfig, 'io.cozy.mocks3')
      expect(mockInitSocket.mock.calls[0][0]).toEqual(mockConfig)
      expect(mockInitSocket.mock.calls.length).toBe(1)
    })

    it('should return a subscription with correct properties', () => {
      const subscription = subscribe(mockConfig, 'io.cozy.mocks')
      expect(mockInitSocket.mock.calls.length).toBe(1)
      expect(mockInitSocket.mock.calls[0][0]).toEqual(mockConfig)
      expect(subscription).toMatchSnapshot()
    })
    //
    ;['onCreate', 'onUpdate', 'onDelete'].forEach(propName => {
      const eventName = propName.replace('on', '').toLowerCase() + 'd'

      it(`subscription should return the subscription on ${propName} call`, () => {
        const subscription = subscribe(mockConfig, 'io.cozy.mocks')
        expect(subscription[propName](jest.fn())).toBe(subscription)
      })

      it(`subscription should subscribe to ${eventName} event on ${propName} call even without listener`, () => {
        const mockCozySocket = {
          subscribe: jest.fn(),
          unsubscribe: jest.fn()
        }
        const mockDoctype = 'io.cozy.mocks'
        __RewireAPI__.__Rewire__('cozySocket', mockCozySocket)

        const subscription = subscribe(mockConfig, mockDoctype)
        subscription[propName](jest.fn())
        expect(mockCozySocket.subscribe.mock.calls.length).toBe(1)
        expect(mockCozySocket.subscribe.mock.calls[0][0]).toBe(mockDoctype)
        expect(mockCozySocket.subscribe.mock.calls[0][1]).toBe(eventName)
      })

      it(`subscription should subscribe to ${eventName} event on ${propName} call with a listener and the default parser`, () => {
        const mockCozySocket = {
          subscribe: jest.fn(),
          unsubscribe: jest.fn()
        }
        const mockDoctype = 'io.cozy.mocks'
        __RewireAPI__.__Rewire__('cozySocket', mockCozySocket)
        const mockListener = jest.fn()
        const mockReceivedDoc = { _id: 123 }

        const subscription = subscribe(mockConfig, mockDoctype)
        subscription[propName](mockListener)
        expect(mockCozySocket.subscribe.mock.calls.length).toBe(1)
        // simulate listener call
        mockCozySocket.subscribe.mock.calls[0][2](mockReceivedDoc)
        expect(mockListener.mock.calls.length).toBe(1)
        expect(mockListener.mock.calls[0][0]).toBe(mockReceivedDoc)
      })

      it(`subscription should subscribe to ${eventName} event on ${propName} call with a listener and a custom parser`, () => {
        const mockCozySocket = {
          subscribe: jest.fn(),
          unsubscribe: jest.fn()
        }
        const mockDoctype = 'io.cozy.mocks'
        __RewireAPI__.__Rewire__('cozySocket', mockCozySocket)
        const mockListener = jest.fn()
        const mockParser = jest.fn(doc => ({
          idparsed: doc._id
        }))
        const mockReceivedDoc = { _id: 123 }
        const parsedDoc = mockParser(mockReceivedDoc)
        mockParser.mockClear()

        const subscription = subscribe(mockConfig, mockDoctype, {
          parse: mockParser
        })
        subscription[propName](mockListener)
        expect(mockCozySocket.subscribe.mock.calls.length).toBe(1)
        // simulate listener call
        mockCozySocket.subscribe.mock.calls[0][2](mockReceivedDoc)
        expect(mockListener.mock.calls.length).toBe(1)
        expect(mockParser.mock.calls.length).toBe(1)
        expect(mockListener.mock.calls[0][0]).toEqual(parsedDoc)
      })
    })

    it('should unsubscribe all events on unsubscribe call', () => {
      const mockCozySocket = {
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      }
      const mockDoctype = 'io.cozy.mocks'
      __RewireAPI__.__Rewire__('cozySocket', mockCozySocket)

      const subscription = subscribe(mockConfig, mockDoctype)
      subscription.unsubscribe()
      expect(mockCozySocket.unsubscribe.mock.calls.length).toBe(3)
      expect(mockCozySocket.unsubscribe.mock.calls).toMatchSnapshot()
    })
  })
  describe('subscribe one doc:', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetModules()
      __RewireAPI__.__Rewire__('initCozySocket', mockInitSocket)
      // reset cozySocket global variable
      __RewireAPI__.__Rewire__('cozySocket', null)
    })

    afterEach(() => {
      __RewireAPI__.__ResetDependency__('initCozySocket')
      __RewireAPI__.__ResetDependency__('cozySocket')
    })

    const mockDocId = 'id124'

    it('should return a subscription with correct properties', () => {
      const subscription = subscribe(mockConfig, 'io.cozy.mocks', {
        docId: mockDocId
      })
      expect(mockInitSocket.mock.calls.length).toBe(1)
      expect(mockInitSocket.mock.calls[0][0]).toEqual(mockConfig)
      expect(subscription).toMatchSnapshot()
    })
    //
    ;['onUpdate', 'onDelete'].forEach(propName => {
      const eventName = propName.replace('on', '').toLowerCase() + 'd'

      it(`subscription should return the subscription on ${propName} call`, () => {
        const subscription = subscribe(mockConfig, 'io.cozy.mocks', {
          docId: mockDocId
        })
        expect(subscription[propName](jest.fn())).toBe(subscription)
      })

      it(`subscription should subscribe to ${eventName} event on ${propName} call even without listener`, () => {
        const mockCozySocket = {
          subscribe: jest.fn(),
          unsubscribe: jest.fn()
        }
        const mockDoctype = 'io.cozy.mocks'
        __RewireAPI__.__Rewire__('cozySocket', mockCozySocket)

        const subscription = subscribe(mockConfig, mockDoctype, {
          docId: mockDocId
        })
        subscription[propName](jest.fn())
        expect(mockCozySocket.subscribe.mock.calls.length).toBe(1)
        expect(mockCozySocket.subscribe.mock.calls[0][0]).toBe(mockDoctype)
        expect(mockCozySocket.subscribe.mock.calls[0][1]).toBe(eventName)
      })

      it(`subscription should subscribe to ${eventName} event on ${propName} call with a listener and the default parser`, () => {
        const mockCozySocket = {
          subscribe: jest.fn(),
          unsubscribe: jest.fn()
        }
        const mockDoctype = 'io.cozy.mocks'
        __RewireAPI__.__Rewire__('cozySocket', mockCozySocket)
        const mockListener = jest.fn()
        const mockReceivedDoc = { _id: 123 }

        const subscription = subscribe(mockConfig, mockDoctype, {
          docId: mockDocId
        })
        subscription[propName](mockListener)
        expect(mockCozySocket.subscribe.mock.calls.length).toBe(1)
        // simulate listener call
        mockCozySocket.subscribe.mock.calls[0][2](mockReceivedDoc)
        expect(mockListener.mock.calls.length).toBe(1)
        expect(mockListener.mock.calls[0][0]).toBe(mockReceivedDoc)
      })

      it(`subscription should subscribe to ${eventName} event on ${propName} call with a listener and a custom parser`, () => {
        const mockCozySocket = {
          subscribe: jest.fn(),
          unsubscribe: jest.fn()
        }
        const mockDoctype = 'io.cozy.mocks'
        __RewireAPI__.__Rewire__('cozySocket', mockCozySocket)
        const mockListener = jest.fn()
        const mockParser = jest.fn(doc => ({
          idparsed: doc._id
        }))
        const mockReceivedDoc = { _id: 123 }
        const parsedDoc = mockParser(mockReceivedDoc)
        mockParser.mockClear()

        const subscription = subscribe(mockConfig, mockDoctype, {
          docId: mockDocId,
          parse: mockParser
        })
        subscription[propName](mockListener)
        expect(mockCozySocket.subscribe.mock.calls.length).toBe(1)
        // simulate listener call
        mockCozySocket.subscribe.mock.calls[0][2](mockReceivedDoc)
        expect(mockListener.mock.calls.length).toBe(1)
        expect(mockParser.mock.calls.length).toBe(1)
        expect(mockListener.mock.calls[0][0]).toEqual(parsedDoc)
      })
    })

    it('should unsubscribe all events on unsubscribe call', () => {
      const mockCozySocket = {
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      }
      const mockDoctype = 'io.cozy.mocks'
      __RewireAPI__.__Rewire__('cozySocket', mockCozySocket)

      const subscription = subscribe(mockConfig, mockDoctype, {
        docId: mockDocId
      })
      subscription.unsubscribe()
      expect(mockCozySocket.unsubscribe.mock.calls.length).toBe(2)
      expect(mockCozySocket.unsubscribe.mock.calls).toMatchSnapshot()
    })
  })
})
