// This spec file is a legacy file, used as proof for non-regression.
// It is superseded by CozyRealtime.spec.js and will probably
// be deleted in a near future. All usefull tests below should
// have counterpart in CozyRealtime.spec.js

import CozyRealtime from './CozyRealtime'
import { Server } from 'mock-socket'
import MicroEE from 'microee'

import Minilog from 'minilog'
Minilog.disable()

const COZY_URL = 'http://cozy.tools:8888'
const WS_URL = 'ws://cozy.tools:8888/realtime/'
const COZY_TOKEN = 'zvNpzsHILcXpnDBlUfmAqVuEEuyWvPYn'

class CozyClient {
  constructor() {
    this.stackClient = {
      uri: COZY_URL,
      token: {
        token: COZY_TOKEN
      },
      fetchJSON: jest.fn(),
      getAccessToken: () => COZY_TOKEN
    }
  }
  getStackClient() {
    return this.stackClient
  }
}

MicroEE.mixin(CozyClient)
const cozyClient = new CozyClient()
const pause = time => new Promise(resolve => setTimeout(resolve, time))

describe('CozyRealtime', () => {
  let realtime, cozyStack, onMessage

  beforeEach(() => {
    onMessage = jest.fn()
    cozyStack = new Server(WS_URL)
    cozyStack.emitMessage = (type, doc, event, id) => {
      cozyStack.emitMessageObject({ type, doc, event, id })
    }
    cozyStack.emitMessageObject = ({ type, doc, event, id }) => {
      cozyStack.emit(
        'message',
        JSON.stringify({ payload: { type, doc, id }, event })
      )
    }
    cozyStack.on('connection', socket => {
      socket.on('message', data => {
        onMessage(data)
      })
    })
    realtime = new CozyRealtime({ client: cozyClient })
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
      expect(handler).toHaveBeenCalledTimes(2)
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
      realtime.subscribe('created', type, handler)
      await realtime.waitForSocketReady()
      expect(realtime.isWebSocketOpen()).toBe(true)
      cozyStack.simulate('error')
      expect(realtime.isWebSocketOpen()).toBe(false)
      cozyStack.emitMessage(type, fakeDoc, 'CREATED')
      expect(handler).not.toHaveBeenCalled()

      await realtime.waitForSocketReady()
      expect(realtime.isWebSocketOpen()).toBe(true)
      cozyStack.emitMessage(type, fakeDoc, 'CREATED')
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should relaunch socket with same parameters', async () => {
      const created = jest.fn()
      realtime.subscribe('created', type, created)
      const updated = jest.fn()
      realtime.subscribe('updated', type, updated)
      const updatedId = jest.fn()
      realtime.subscribe('updated', type, id, updatedId)
      realtime.unsubscribe('created', type, created)
      await realtime.waitForSocketReady()

      cozyStack.simulate('error')
      pause(10)
      await realtime.waitForSocketReady()

      const doc = {}
      cozyStack.emitMessageObject({ event: 'CREATED', type, id, doc })
      cozyStack.emitMessageObject({ event: 'UPDATED', type, id, doc })
      cozyStack.emitMessageObject({ event: 'UPDATED', type, id: 3, doc })
      expect(created).toHaveBeenCalledTimes(0)
      expect(updated).toHaveBeenCalledTimes(2)
      expect(updatedId).toHaveBeenCalledTimes(1)
    })

    it('should launch only one connection when multiple subscribe is call', async () => {
      const handler = jest.fn()
      const isOpened = jest.fn()

      cozyStack.on('connection', isOpened)
      realtime.subscribe('created', type, handler)
      realtime.subscribe('created', type, handler)
      await realtime.waitForSocketReady()
      await pause(10)

      expect(isOpened).toBeCalledTimes(1)
      cozyStack.emitMessage(type, fakeDoc, 'CREATED')
      expect(handler).toBeCalledTimes(2)
    })
  })

  describe('unsubscribe', () => {
    let handlerCreate, handlerUpdate, handlerDelete

    beforeEach(async () => {
      handlerCreate = jest.fn()
      handlerUpdate = jest.fn()
      handlerDelete = jest.fn()
      realtime.subscribe('created', type, handlerCreate)
      realtime.subscribe('updated', type, handlerUpdate)
      realtime.subscribe('deleted', type, handlerDelete)
      realtime.subscribe('created', 'io.cozy.accounts', handlerCreate)
    })

    afterEach(() => {
      realtime.unsubscribeAll()
    })

    it('should unsubscribe a created event', async () => {
      await realtime.waitForSocketReady()
      expect(realtime.isWebSocketOpen()).toBe(true)
      realtime.unsubscribe('created', type, handlerCreate)
      expect(realtime.isWebSocketOpen()).toBe(true)
      realtime.unsubscribe('updated', type, handlerUpdate)
      expect(realtime.isWebSocketOpen()).toBe(true)
      realtime.unsubscribe('deleted', type, handlerDelete)
      expect(realtime.isWebSocketOpen()).toBe(true)
      realtime.unsubscribe('created', 'io.cozy.accounts', handlerCreate)
      pause(10)
      expect(realtime.isWebSocketOpen()).toBe(false)
    })

    it('should stop receiving created documents with given doctype', async () => {
      await realtime.waitForSocketReady()
      expect(handlerCreate).not.toHaveBeenCalled()
      realtime.unsubscribe('created', type, handlerCreate)
      cozyStack.emitMessage(type, fakeDoc, 'CREATED')
      expect(handlerCreate).not.toHaveBeenCalled()
    })

    it('should unsubscribe all events', async () => {
      await realtime.waitForSocketReady()
      expect(realtime.isWebSocketOpen()).toBe(true)
      realtime.unsubscribeAll()
      await pause(10)
      expect(realtime.isWebSocketOpen()).toBe(false)
    })

    it(`should not unsubscribe 'error' event`, async done => {
      realtime.on('error', () => done())
      realtime.unsubscribeAll()
      realtime.emit('error')
    })
  })

  describe('events', () => {
    it('should emit error when retry limit is exceeded', async done => {
      realtime.retryManager.shouldEmitError = function() {
        return this.retries > 2
      }
      let shouldContinue = true
      const handler = jest.fn()
      realtime.subscribe('created', type, handler)
      realtime.on('error', () => {
        shouldContinue = false
        done()
      })
      while (shouldContinue) {
        await realtime.waitForSocketReady()
        cozyStack.simulate('error')
      }
    })
  })

  describe('authentication', () => {
    it('should update socket authentication when client logs in', async () => {
      const handler = jest.fn()
      realtime.subscribe('created', type, handler)
      await realtime.waitForSocketReady()
      onMessage.mockClear()
      expect(onMessage).not.toHaveBeenCalled()
      cozyClient.emit('login')
      await pause(10)
      expect(onMessage).toHaveBeenCalled()
      const called = onMessage.mock.calls[0]
      const data = JSON.parse(called[0])
      expect(data).toHaveProperty('method', 'AUTH')
    })

    it('should update socket authentication when client token is refreshed ', async () => {
      const handler = jest.fn()
      realtime.subscribe('created', type, handler)
      await realtime.waitForSocketReady()
      onMessage.mockClear()
      expect(onMessage).not.toHaveBeenCalled()
      cozyClient.emit('tokenRefreshed')
      await pause(10)
      expect(onMessage).toHaveBeenCalled()
      const called = onMessage.mock.calls[0]
      const data = JSON.parse(called[0])
      expect(data).toHaveProperty('method', 'AUTH')
    })
  })
})

describe('send', () => {
  beforeEach(() => {
    cozyClient.stackClient.fetchJSON.mockReset()
  })

  it('should send a message', async () => {
    const realtime = new CozyRealtime({ client: cozyClient })
    await realtime.send('io.cozy.doctype', 'my-id', { message: 'hello' })
    expect(cozyClient.stackClient.fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/realtime/io.cozy.doctype/my-id',
      { data: { message: 'hello' } }
    )
  })
})
