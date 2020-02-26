import { Server } from 'mock-socket'
import MicroEE from 'microee'

import CozyRealtime from './CozyRealtime'
import logger from './logger'
import {
  allowDoubleSubscriptions,
  requireDoubleUnsubscriptions
} from './config'

const testLogger = logger.minilog('test/cozy-realtime')

logger.minilog.suggest
  .clear()
  .allow('cozy-realtime', 'debug')
  .allow('test/cozy-realtime', 'debug')

logger.minilog.disable()

const doctype = 'io.cozy.files'
const type = doctype
const id = 'my-document-id'
const message = { message: 'hello' }
const doc = message
const event = 'UPDATED'
const payload = { type, doc, id }

const defaultClientUri = 'https://cozy.tools/'
const defaultClientToken = 'MY-TOKEN'
const defaultWebsocketUri =
  defaultClientUri.replace(/^http/, 'ws') + 'realtime/'

function createCozyClient({ uri, token } = {}) {
  const stackClient = {
    getAccessToken: () => token || defaultClientToken,
    uri: uri || defaultClientUri,
    fetchJSON: jest.fn()
  }
  class CozyClientMock {
    getStackClient() {
      return stackClient
    }
  }
  MicroEE.mixin(CozyClientMock)
  return new CozyClientMock()
}

function createRealtime(options = {}) {
  const client = options.client || createCozyClient(options)
  return new CozyRealtime({ client })
}

function createSocketServer({
  wsuri,
  verifyClient,
  onconnect,
  onmessage,
  onauth,
  onsubscribe,
  onunsubscribe,
  onunknownmessage,
  oneverymessage
} = {}) {
  wsuri = wsuri || defaultWebsocketUri
  if (verifyClient === false) verifyClient = () => false
  const options = verifyClient ? { verifyClient } : {}
  const server = new Server(wsuri, options)
  server.emitMessage = (event, payload) => {
    testLogger.info('send message to client', { event, payload })
    server.emit('message', JSON.stringify({ event, payload }))
  }
  server.onauth = onauth || jest.fn()
  server.onsubscribe = onsubscribe || jest.fn()
  server.onunsubscribe = onunsubscribe || jest.fn()
  server.onunknownmessage = onunknownmessage || jest.fn()
  server.oneverymessage =
    oneverymessage ||
    jest.fn().mockImplementation(data => {
      testLogger.debug('receive message from client', data)
    })
  server.onmessage =
    onmessage ||
    jest.fn().mockImplementation(json => {
      const data = JSON.parse(json)
      server.oneverymessage(data)
      if (data.method == 'AUTH') server.onauth(data.payload)
      else if (data.method == 'SUBSCRIBE') server.onsubscribe(data.payload)
      else if (data.method == 'UNSUBSCRIBE') server.onunsubscribe(data.payload)
      else server.onunknownmessage(data)
    })
  server.onconnect =
    onconnect ||
    jest.fn().mockImplementation(socket => {
      server.lastOpenedSocket = socket
      testLogger.debug('receive new socket connection from client')
      socket.on('message', server.onmessage)
    })
  server.on('connection', server.onconnect)
  // the mock-socket server doesn't seem to dispath the 'close' event
  // on server side despite what the doc is saying, so we cheat…
  server.hasClosedLastSocket = () => {
    return server.lastOpenedSocket.readyState === 3
  }
  return server
}

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

/*** TEST ***/

describe('CozyRealtime', () => {
  describe('sendNotification', () => {
    it('posts a message to the stack', async () => {
      const client = createCozyClient()
      const fetchJSON = client.getStackClient().fetchJSON
      const realtime = createRealtime({ client })
      await realtime.sendNotification(doctype, id, message)
      const route = `/realtime/${doctype}/${id}`
      expect(fetchJSON).toHaveBeenCalledWith('POST', route, { data: message })
    })
  })

  describe('subscribe', () => {
    it('receives a subscription on the server', done => {
      const server = createSocketServer()
      const realtime = createRealtime()
      server.onsubscribe.mockImplementation(data => {
        expect(data).toHaveProperty('type', type)
        server.stop(done)
      })
      realtime.subscribe(event, type, jest.fn())
    })

    describe('when subscribing before the socket being ready', () => {
      it('should receive corresponding messages on the handler', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn().mockImplementation(data => {
          expect(data).toEqual(doc)
          server.stop(done)
        })
        realtime.subscribe(event, type, handler)

        await realtime.waitForSocketReady()
        server.emitMessage(event, payload)
      })
    })

    describe('when subscribing before the socket being ready', () => {
      it('should receive corresponding messages on the handler', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn().mockImplementation(data => {
          expect(data).toEqual(doc)
          server.stop(done)
        })

        realtime.subscribe('DELETED', 'io.cozy.notes', 'other-id', handler)
        await realtime.waitForSocketReady()

        realtime.subscribe(event, type, handler)
        await sleep(10)
        server.emitMessage(event, payload)
      })
    })

    it('should not trigger on message for other types', async done => {
      const server = createSocketServer()
      const realtime = createRealtime()

      const handler = jest.fn()
      realtime.subscribe(event, 'other-type', id, handler)

      await realtime.waitForSocketReady()
      server.emitMessage(event, payload)
      await sleep(100)

      expect(handler).not.toHaveBeenCalled()
      server.stop(done)
    })

    it('should not trigger on message for other events', async done => {
      const server = createSocketServer()
      const realtime = createRealtime()

      const handler = jest.fn()
      realtime.subscribe('DELETED', type, id, handler)

      await realtime.waitForSocketReady()
      server.emitMessage('UPDATED', payload)
      await sleep(100)

      expect(handler).not.toHaveBeenCalled()
      server.stop(done)
    })

    describe('without an id', () => {
      it('should be able to trigger on a payload with an id', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn().mockImplementation(data => {
          expect(data).toEqual(doc)
          server.stop(done)
        })
        realtime.subscribe(event, type, handler)

        await realtime.waitForSocketReady()
        server.emitMessage(event, payload)
      })

      it('should be able to trigger on a payload without an id', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn().mockImplementation(data => {
          expect(data).toEqual(doc)
          server.stop(done)
        })
        realtime.subscribe('CREATED', type, handler)

        await realtime.waitForSocketReady()
        server.emitMessage('CREATED', { type, doc })
      })
    })

    describe('with an id', () => {
      it('should trigger for corresponding events', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn().mockImplementation(data => {
          expect(data).toEqual(doc)
          server.stop(done)
        })
        realtime.subscribe(event, type, id, handler)

        await realtime.waitForSocketReady()
        server.emitMessage(event, payload)
      })

      it('should not trigger for other ids', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn()
        realtime.subscribe(event, type, 'other_id', handler)

        await realtime.waitForSocketReady()
        server.emitMessage(event, payload)
        await sleep(100)

        expect(handler).not.toHaveBeenCalled()
        server.stop(done)
      })
    })

    it('should accept an subscription with an undefined id', async done => {
      const server = createSocketServer()
      const realtime = createRealtime()

      const handler = jest.fn().mockImplementation(data => {
        expect(data).toEqual(doc)
        server.stop(done)
      })
      realtime.subscribe(event, type, undefined, handler)

      await realtime.waitForSocketReady()
      server.emitMessage(event, payload)
    })

    it('should allow multiple handlers for the same message', async done => {
      const server = createSocketServer()
      const realtime = createRealtime()

      const handler1 = jest.fn().mockImplementation(data => {
        expect(data).toEqual(doc)
        finish()
      })
      const handler2 = jest.fn().mockImplementation(data => {
        expect(data).toEqual(doc)
        finish()
      })

      function finish() {
        handler1.mock.calls.length == 1 &&
          handler2.mock.calls.length == 1 &&
          server.stop(done)
      }

      realtime.subscribe(event, type, undefined, handler1)
      realtime.subscribe(event, type, undefined, handler2)

      await realtime.waitForSocketReady()
      server.emitMessage(event, payload)
    })

    if (allowDoubleSubscriptions) {
      it('should call twice the handler if subscribe 2 times', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn().mockImplementation(data => {
          expect(data).toEqual(doc)
          finish()
        })

        function finish() {
          handler.mock.calls.length == 2 && server.stop(done)
        }

        realtime.subscribe(event, type, undefined, handler)
        realtime.subscribe(event, type, undefined, handler)

        await realtime.waitForSocketReady()
        server.emitMessage(event, payload)
      })
    } else {
      it('should not call the handler twice in case of double subscription', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)
        realtime.subscribe(event, type, undefined, handler)

        await realtime.waitForSocketReady()
        server.emitMessage(event, payload)
        await sleep(100)

        expect(handler).toHaveBeenCalledTimes(1)
        server.stop(done)
      })
    }
  })

  describe('unsubscribe', () => {
    describe('when unsubscribing before the socket being ready', () => {
      it('should not trigger the handler after unsubscription', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)
        realtime.unsubscribe(event, type, undefined, handler)

        await realtime.waitForSocketReady()
        server.emitMessage(event, payload)
        await sleep(100)

        expect(handler).not.toHaveBeenCalled()
        server.stop(done)
      })
    })

    describe('when unsubscribing after the socket being ready', () => {
      it('should not trigger the handler after unsubscription', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)

        await realtime.waitForSocketReady()
        realtime.unsubscribe(event, type, undefined, handler)
        await sleep(10)
        server.emitMessage(event, payload)
        await sleep(100)

        expect(handler).not.toHaveBeenCalled()
        server.stop(done)
      })
    })

    it('should allow unattended unsubscription', async done => {
      const server = createSocketServer()
      const realtime = createRealtime()

      const handler = jest.fn()
      realtime.subscribe(event, type, undefined, handler)
      realtime.unsubscribe(event, 'io.cozy.notes', undefined, handler)

      await realtime.waitForSocketReady()
      await sleep(10)
      server.stop(done)
    })

    if (allowDoubleSubscriptions) {
      if (requireDoubleUnsubscriptions) {
        it('should require a double unsubscription for a double subscription', async done => {
          const server = createSocketServer()
          const realtime = createRealtime()

          const handler = jest.fn()
          realtime.subscribe(event, type, undefined, handler)
          realtime.subscribe(event, type, undefined, handler)
          realtime.unsubscribe(event, type, undefined, handler)
          await realtime.waitForSocketReady()

          // first unsubscription leaves one handler
          server.emitMessage(event, payload)
          await sleep(50)

          // second unsubscription should not trigger the handler anymore
          realtime.unsubscribe(event, type, undefined, handler)
          await sleep(50)
          server.emitMessage(event, payload)

          await sleep(100)
          expect(handler).toHaveBeenCalledTimes(1)
          server.stop(done)
        })
      } else {
        it('should not require a double unsubscription for a double subscription', async done => {
          const server = createSocketServer()
          const realtime = createRealtime()

          const handler = jest.fn()
          realtime.subscribe(event, type, undefined, handler)
          realtime.subscribe(event, type, undefined, handler)
          realtime.unsubscribe(event, type, undefined, handler)
          await realtime.waitForSocketReady()

          server.emitMessage(event, payload)
          await sleep(100)
          expect(handler).not.toHaveBeenCalled()
          server.stop(done)
        })
      }
    }

    describe('when unsubscribing the last subscription', () => {
      it('should close the websocket', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)

        await realtime.waitForSocketReady()
        realtime.unsubscribe(event, type, undefined, handler)
        await sleep(200)

        expect(server.hasClosedLastSocket()).toBeTruthy()
        server.stop(done)
      })
    })
  })

  describe('unsubscribeAll', () => {
    it('should remove all subscriptions', async done => {
      const server = createSocketServer()
      const realtime = createRealtime()

      const handler = jest.fn()
      realtime.subscribe(event, type, undefined, handler)

      await realtime.waitForSocketReady()
      realtime.unsubscribeAll()
      await sleep(10)
      server.emitMessage(event, payload)
      await sleep(100)

      expect(handler).not.toHaveBeenCalled()
      server.stop(done)
    })

    it('should close the socket', async done => {
      const server = createSocketServer()
      const realtime = createRealtime()

      const handler = jest.fn()
      realtime.subscribe(event, type, undefined, handler)

      await realtime.waitForSocketReady()
      realtime.unsubscribeAll()
      await sleep(10)
      server.emitMessage(event, payload)
      await sleep(100)

      expect(server.hasClosedLastSocket()).toBeTruthy()
      server.stop(done)
    })
  })

  describe('cozy-client events', () => {
    describe('login', () => {
      it('should authenticate again', async done => {
        const client = createCozyClient()
        const server = createSocketServer()
        const realtime = createRealtime({ client })

        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)

        await realtime.waitForSocketReady()
        client.emit('login')

        await sleep(100)
        expect(server.onauth).toHaveBeenCalledTimes(2)
        expect(server.onsubscribe).toHaveBeenCalledTimes(2)
        server.stop(done)
      })
    })

    describe('logout', () => {
      it('should close the socket', async done => {
        const client = createCozyClient()
        const server = createSocketServer()
        const realtime = createRealtime({ client })

        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)

        await realtime.waitForSocketReady()
        client.emit('logout')

        await sleep(100)
        expect(server.hasClosedLastSocket()).toBeTruthy()
        server.stop(done)
      })
    })

    describe('tokenRefreshed', () => {
      it('has nothing to do', () => {
        // no neeed to re-authenticate on realtime
      })
    })
  })

  describe('socket events', () => {
    describe('error', () => {
      it('should restart a connected socket', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)

        await realtime.waitForSocketReady()
        server.simulate('error')

        await sleep(100)
        expect(server.onconnect).toHaveBeenCalledTimes(2)
        server.stop(done)
      })

      it('should restart a connecting socket', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)
        server.simulate('error')

        await sleep(100)
        await realtime.waitForSocketReady()

        expect(server.hasClosedLastSocket()).toBeFalsy()
        server.stop(done)
      })

      it('should not connect a non connected socket', async done => {
        const server = createSocketServer()
        createRealtime()

        server.simulate('error')

        await sleep(100)
        expect(server.onconnect).not.toHaveBeenCalled()
        server.stop(done)
      })
    })

    describe('close', () => {
      it('should  try to reconnect', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()

        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)

        await realtime.waitForSocketReady()
        server.lastOpenedSocket.close()

        await sleep(100)
        expect(server.onconnect).toHaveBeenCalledTimes(2)
        server.stop(done)
      })
    })
  })

  describe('network conditions', () => {
    describe('offline when connecting', () => {
      it('should connect as soon as possible', async done => {
        const realtime = createRealtime()

        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)
        await sleep(100)

        const server = createSocketServer()
        await realtime.waitForSocketReady()

        expect(server.onconnect).toHaveBeenCalled()
        server.stop(done)
      })
    })

    describe('connection concurrency', () => {
      it('should not start two concurrent connections', async done => {
        const server = createSocketServer()
        const realtime = createRealtime()
        const handler = jest.fn()
        realtime.subscribe(event, type, undefined, handler)
        await realtime.waitForSocketReady()

        // makes the reconnect wait
        realtime.retryManager.onFailure()
        realtime.retryManager.onFailure()
        realtime.retryManager.onFailure()
        realtime.retryManager.onFailure()
        realtime.retryManager.onFailure()
        realtime.onOnline()
        await sleep(25)

        // reconnect before the previous connection finishes to wait
        realtime.onOnline()
        await realtime.waitForSocketReady()

        expect(server.onconnect).toHaveBeenCalledTimes(2)
        server.stop(done)
      })
    })
  })
})
