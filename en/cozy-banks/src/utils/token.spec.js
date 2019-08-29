import { checkToRefreshToken } from './token'

const DAY = 1000 * 60 * 60 * 24

describe('refresh token', () => {
  let client,
    store,
    tokenState = {},
    onRefresh
  beforeEach(() => {
    client = {
      stackClient: {
        refreshToken: jest.fn()
      }
    }
    onRefresh = jest.fn()
    store = {
      getState: () => ({
        mobile: {
          token: tokenState
        }
      })
    }
  })

  it('should refresh token if no issued at', () => {
    checkToRefreshToken(client, store, onRefresh)()
    expect(client.stackClient.refreshToken).toHaveBeenCalled()
    expect(onRefresh).toHaveBeenCalled()
  })

  it('should refresh token if issued at too long ago', () => {
    tokenState.issuedAt = new Date(Date.now() - 8 * DAY)
    checkToRefreshToken(client, store, onRefresh)()
    expect(client.stackClient.refreshToken).toHaveBeenCalled()
    expect(onRefresh).toHaveBeenCalled()
  })

  it('should not refresh token if issued at not too long ago', () => {
    tokenState.issuedAt = new Date(Date.now() - 5 * DAY)
    checkToRefreshToken(client, store, onRefresh)()
    expect(client.stackClient.refreshToken).not.toHaveBeenCalled()
    expect(onRefresh).not.toHaveBeenCalled()
  })
})
