import CozyClient from 'cozy-client'
import { clear } from './storage'
import PinPlugin from './plugin'

jest.mock('./storage', () => ({ clear: jest.fn() }))

describe('pin plugin', () => {
  it('should remove storage on logout', () => {
    const client = new CozyClient({})
    client.registerPlugin(PinPlugin)
    expect(clear).not.toHaveBeenCalled()
    client.emit('beforeLogout')
    expect(clear).toHaveBeenCalledTimes(1)
  })
})
