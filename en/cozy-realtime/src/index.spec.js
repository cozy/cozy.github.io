import CozyRealtime, {
  generateKey,
  getWebSocketUrl,
  getWebSocketToken
} from '.'
import { Server } from 'mock-socket'
import MicroEE from 'microee'

const COZY_URL = 'http://cozy.tools:8888'
const WS_URL = 'ws://cozy.tools:8888/realtime/'
const COZY_TOKEN = 'zvNpzsHILcXpnDBlUfmAqVuEEuyWvPYn'
class CozyClient {
  stackClient = {
    uri: COZY_URL,
    token: {
      token: COZY_TOKEN
    }
  }
}
MicroEE.mixin(CozyClient)
const cozyClient = new CozyClient()
const pause = time => new Promise(resolve => setTimeout(resolve, time))

describe('CozyRealtime', () => {
  let realtime, cozyStack

  beforeEach(() => {
    realtime = new CozyRealtime({ client: cozyClient })
    cozyStack = new Server(WS_URL)
    cozyStack.emitMessage = (type, doc, event, id) => {
      cozyStack.emit(
        'message',
        JSON.stringify({ payload: { type, doc, id }, event })
      )
    }
  })

  afterEach(() => {
    realtime.unsubscribeAll()
    cozyStack.stop()
  })

  const type = 'io.cozy.bank.accounts'
  const id = 'doc_id'
  const fakeDoc = { _id: id, title: 'title1' }

  describe('subscribe', () => {
    it('should launch handler when document is created', async done => {
      await realtime.subscribe('created', type, doc => {
        expect(doc).toEqual(fakeDoc)
        done()
      })

      cozyStack.emitMessage(type, fakeDoc, 'CREATED')
    })

    it('should throw an error when config has id for created event', () => {
      expect(() =>
        realtime.subscribe('created', type, 'my_id', () => {})
      ).toThrow()
    })

    it('should launch handler when document is updated', async done => {
      await realtime.subscribe('updated', type, doc => {
        expect(doc).toEqual(fakeDoc)
        done()
      })

      cozyStack.emitMessage(type, fakeDoc, 'UPDATED')
    })

    it('should launch handler when document with id is updated', async done => {
      await realtime.subscribe('updated', type, fakeDoc._id, doc => {
        expect(doc).toEqual(fakeDoc)
        done()
      })

      cozyStack.emitMessage(type, fakeDoc, 'UPDATED', fakeDoc._id)
    })

    it('should launch all handler when receive updated document', async () => {
      const handler = jest.fn()
      await realtime.subscribe('updated', type, handler)
      await realtime.subscribe('updated', type, fakeDoc._id, handler)

      cozyStack.emitMessage(type, fakeDoc, 'UPDATED', fakeDoc._id)
      await pause(10)
      expect(handler.mock.calls.length).toBe(2)
    })

    it('should launch handler when document is deleted', async done => {
      await realtime.subscribe('deleted', type, doc => {
        expect(doc).toEqual(fakeDoc)
        done()
      })

      cozyStack.emitMessage(type, fakeDoc, 'DELETED')
    })

    it('should launch handler when document with id is deleted', async done => {
      await realtime.subscribe('deleted', type, fakeDoc._id, doc => {
        expect(doc).toEqual(fakeDoc)
        done()
      })

      cozyStack.emitMessage(type, fakeDoc, 'DELETED', fakeDoc._id)
    })

    it('should relaunch socket subscribe after an error', async () => {
      const handler = jest.fn()
      await realtime.subscribe('created', type, handler)
      realtime._retryDelay = 100

      expect(realtime._socket.isOpen()).toBe(true)
      cozyStack.simulate('error')
      expect(realtime._socket.isOpen()).toBe(false)
      cozyStack.emitMessage(type, fakeDoc, 'CREATED')
      expect(handler.mock.calls.length).toBe(0)

      await pause(200)
      expect(realtime._socket.isOpen()).toBe(true)
      cozyStack.emitMessage(type, fakeDoc, 'CREATED')
      expect(handler.mock.calls.length).toBe(1)
    })

    it('should relaunch socket with same parameters', async () => {
      const handler = jest.fn()

      await realtime.subscribe('created', type, handler)
      const spy = jest.spyOn(realtime._socket, 'subscribe')
      await realtime.subscribe('updated', type, handler)
      await realtime.subscribe('updated', type, id, handler)
      await realtime.unsubscribe('created', type, handler)
      await pause(10)

      realtime._resubscribe()
      expect(spy).toHaveBeenCalledTimes(4)
      expect(spy.mock.calls[0][0]).toEqual(spy.mock.calls[2][0]) // type
      expect(spy.mock.calls[0][1]).toEqual(spy.mock.calls[2][1]) // id
      expect(spy.mock.calls[1][0]).toEqual(spy.mock.calls[3][0]) // type
      expect(spy.mock.calls[1][1]).toEqual(spy.mock.calls[3][1]) // id
    })

    it('should launch only one connection when multiple subscribe is call', async () => {
      const handler = jest.fn()
      const isOpened = jest.fn()
      realtime._socket.on('open', isOpened)
      realtime.subscribe('created', type, handler)
      realtime.subscribe('created', type, handler)
      await pause(10)

      expect(isOpened.mock.calls.length).toBe(1)
      cozyStack.emitMessage(type, fakeDoc, 'CREATED')
      expect(handler.mock.calls.length).toBe(2)
    })
  })

  describe('_haveEventHandler', () => {
    it('should return if have event handler', async () => {
      const handler = jest.fn()
      expect(realtime._haveEventHandler()).toBe(false)
      await realtime.subscribe('created', type, handler)
      expect(realtime._haveEventHandler()).toBe(true)
      await realtime.subscribe('updated', type, handler)
      expect(realtime._haveEventHandler()).toBe(true)
      await realtime.unsubscribe('created', 'another_type', handler)
      expect(realtime._haveEventHandler()).toBe(true)
      await realtime.unsubscribe('created', type, handler)
      expect(realtime._haveEventHandler()).toBe(true)
      await realtime.unsubscribe('updated', type, handler)
      expect(realtime._haveEventHandler()).toBe(false)
    })
  })

  describe('unsubscribe', () => {
    let handlerCreate, handlerUpdate, handlerDelete

    beforeEach(async () => {
      handlerCreate = jest.fn()
      handlerUpdate = jest.fn()
      handlerDelete = jest.fn()
      await realtime.subscribe('created', type, handlerCreate)
      await realtime.subscribe('updated', type, handlerUpdate)
      await realtime.subscribe('deleted', type, handlerDelete)
      await realtime.subscribe('created', 'io.cozy.accounts', handlerCreate)
    })

    afterEach(() => {
      realtime.unsubscribeAll()
    })

    it('should unsubscribe a created event', () => {
      expect(realtime._socket.isOpen()).toBe(true)
      realtime.unsubscribe('created', type, handlerCreate)
      expect(realtime._socket.isOpen()).toBe(true)
      realtime.unsubscribe('updated', type, handlerUpdate)
      expect(realtime._socket.isOpen()).toBe(true)
      realtime.unsubscribe('deleted', type, handlerDelete)
      expect(realtime._socket.isOpen()).toBe(true)
      realtime.unsubscribe('created', 'io.cozy.accounts', handlerCreate)
      expect(realtime._socket.isOpen()).toBe(false)
    })

    it('should stop receiving created documents with given doctype', () => {
      expect(handlerCreate.mock.calls.length).toBe(0)
      realtime.unsubscribe('created', type, handlerCreate)
      cozyStack.emitMessage(type, fakeDoc, 'CREATED')
      expect(handlerCreate.mock.calls.length).toBe(0)
    })

    it('should unsubscribe all events', async () => {
      expect(realtime._socket.isOpen()).toBe(true)
      realtime.unsubscribeAll()
      expect(realtime._socket.isOpen()).toBe(false)
    })

    it(`should not unsubscribe 'error' event`, async done => {
      realtime.on('error', () => done())
      realtime.unsubscribeAll()
      realtime.emit('error')
    })
  })

  describe('events', () => {
    it('should emit error when retry limit is exceeded', async done => {
      realtime._retryLimit = 0

      realtime.on('error', () => done())
      const handler = jest.fn()

      await realtime.subscribe('created', type, handler)
      expect(realtime._socket.isOpen()).toBe(true)
      cozyStack.simulate('error')
    })
  })

  describe('authentication', () => {
    it('should update socket authentication when client logs in', async () => {
      realtime._socket.authenticate = jest.fn()
      cozyClient.emit('login')
      expect(realtime._socket.authenticate.mock.calls.length).toBe(1)
    })

    it('should update socket authentication when client token is refreshed ', async () => {
      realtime._socket.authenticate = jest.fn()
      cozyClient.emit('tokenRefreshed')
      expect(realtime._socket.authenticate.mock.calls.length).toBe(1)
    })
  })
})

describe('generateKey', () => {
  it('should return key from config', () => {
    expect(generateKey('created', 'io.cozy.bank.accounts')).toBe(
      'created//io.cozy.bank.accounts//undefined'
    )
    expect(
      generateKey('created', 'io.cozy.bank.accounts', 'a_document_id')
    ).toBe('created//io.cozy.bank.accounts//a_document_id')
  })
})

describe('getWebSocketUrl', () => {
  it('should return WebSocket url from cozyClient', () => {
    const fakeCozyClient = { stackClient: {} }
    fakeCozyClient.stackClient.uri = 'https://a.cozy.url'
    expect(getWebSocketUrl(fakeCozyClient)).toBe('wss://a.cozy.url/realtime/')
    fakeCozyClient.stackClient.uri = COZY_URL
    expect(getWebSocketUrl(fakeCozyClient)).toBe(WS_URL)
    fakeCozyClient.stackClient.uri = 'https://b.cozy.url'
    expect(getWebSocketUrl(fakeCozyClient)).toBe('wss://b.cozy.url/realtime/')
    fakeCozyClient.stackClient.uri = 'http://b.cozy.url'
    expect(getWebSocketUrl(fakeCozyClient)).toBe('ws://b.cozy.url/realtime/')
  })
})

describe('getWebSocketToken', () => {
  it('should return web token from cozyClient', () => {
    const fakeCozyClient = { stackClient: { token: {} } }
    fakeCozyClient.stackClient.token.token = COZY_TOKEN
    expect(getWebSocketToken(fakeCozyClient)).toBe(COZY_TOKEN)
    fakeCozyClient.stackClient.token.token = 'token2'
    expect(getWebSocketToken(fakeCozyClient)).toBe('token2')
  })

  it('should return oauth token from cozyClient', () => {
    const fakeCozyClient = { stackClient: { token: {} } }
    fakeCozyClient.stackClient.token.accessToken = COZY_TOKEN
    expect(getWebSocketToken(fakeCozyClient)).toBe(COZY_TOKEN)
    fakeCozyClient.stackClient.token.accessToken = 'token2'
    expect(getWebSocketToken(fakeCozyClient)).toBe('token2')
  })
})
