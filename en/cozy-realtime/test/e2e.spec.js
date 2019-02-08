import { Server } from 'mock-socket'
import realtime, { getListeners, getSocket, getCozySocket } from '../src/index'

const MOCK_SERVER_DOMAIN = 'localhost:8880'
const REALTIME_URL = `ws://${MOCK_SERVER_DOMAIN}/realtime/`

const mockConfig = {
  domain: MOCK_SERVER_DOMAIN,
  secure: false,
  token: 'blablablatoken'
}

// mock-socket server
let server
jest.useFakeTimers() // mock-socket use timers to delay onopen call
describe('(cozy-realtime) API: ', () => {
  describe('subscribe all docs:', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.resetModules()
      server = new Server(REALTIME_URL)
    })

    afterEach(() => {
      server.stop()
    })

    it('should have a correctly configured socket, cozySocket and listeners on subscribe call and reset listeners on unsubscribe (all docs)', async () => {
      const subscription = realtime
        .subscribe(mockConfig, 'io.cozy.mocks')
        .onCreate(jest.fn())
        .onUpdate(jest.fn())
        .onDelete(jest.fn())
      jest.runAllTimers()
      expect(getListeners().size).toBe(1) // one doctype listener here
      expect(getListeners()).toMatchSnapshot('listeners')
      expect(await getSocket()).toMatchSnapshot('websocket')
      expect(getCozySocket()).toMatchSnapshot('cozySocket')
      // unsubscribe
      subscription.unsubscribe()
      jest.runAllTimers()
      expect(getListeners().size).toBe(0)
    })

    it('should have a correctly configured socket, cozySocket and listeners on subscribe call and reset listeners on unsubscribe (one doc)', async () => {
      const subscription = realtime
        .subscribe(mockConfig, 'io.cozy.mocks', 'id1234')
        .onCreate(jest.fn())
        .onUpdate(jest.fn())
        .onDelete(jest.fn())
      jest.runAllTimers()
      expect(getListeners().size).toBe(1) // one doctype listener here
      expect(getListeners()).toMatchSnapshot('listeners')
      expect(await getSocket()).toMatchSnapshot('websocket')
      expect(getCozySocket()).toMatchSnapshot('cozySocket')
      // unsubscribe
      subscription.unsubscribe()
      jest.runAllTimers()
      expect(getListeners().size).toBe(0)
    })
  })
})
