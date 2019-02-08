import __RewireAPI__, { subscribeWhenReady } from '../src/index'

let mockSubscribe = jest.fn(subscribeWhenReady)
const MAX_RETRIES = 10 // decrease the max retries for the test

const getMockSocket = sendFn => ({
  readyState: 1,
  send: sendFn
})

describe('(cozy-realtime) subscribeWhenReady: ', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __RewireAPI__.__Rewire__('subscribeWhenReady', mockSubscribe)
    __RewireAPI__.__Rewire__('MAX_SOCKET_POLLS', MAX_RETRIES)
  })

  afterEach(() => {
    __RewireAPI__.__ResetDependency__('subscribeWhenReady')
    __RewireAPI__.__ResetDependency__('MAX_SOCKET_POLLS')
    __RewireAPI__.__ResetDependency__('socketPromise')
  })

  it('should send the correct socket message if socket opened', async () => {
    const mockSend = jest.fn()
    __RewireAPI__.__Rewire__(
      'socketPromise',
      Promise.resolve(getMockSocket(mockSend))
    )
    // no results here we just test if it resolves
    await expect(mockSubscribe('io.cozy.mocks')).resolves.toBeUndefined()
    expect(mockSubscribe).toHaveBeenCalledTimes(1)
    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(JSON.parse(mockSend.mock.calls[0][0])).toMatchSnapshot()
  })

  it('should send the correct socket message if socket opened with docId provided', async () => {
    const mockSend = jest.fn()
    __RewireAPI__.__Rewire__(
      'socketPromise',
      Promise.resolve(getMockSocket(mockSend))
    )
    // no results here we just test if it resolves
    await expect(
      mockSubscribe('io.cozy.mocks', 'id1234')
    ).resolves.toBeUndefined()
    expect(mockSubscribe).toHaveBeenCalledTimes(1)
    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(JSON.parse(mockSend.mock.calls[0][0])).toMatchSnapshot()
  })

  it('should throw error + warn if message sent with error', async () => {
    const sendError = new Error('expected socket send error')
    const mockSend = jest.fn(() => {
      throw sendError
    })
    __RewireAPI__.__Rewire__(
      'socketPromise',
      Promise.resolve(getMockSocket(mockSend))
    )
    console.warn = jest.fn()
    await expect(mockSubscribe('io.cozy.mocks')).rejects.toThrow(sendError)
    expect(mockSubscribe).toHaveBeenCalledTimes(1)
    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.warn.mock.calls[0][0]).toMatchSnapshot()
    console.warn.mockRestore()
  })
})
