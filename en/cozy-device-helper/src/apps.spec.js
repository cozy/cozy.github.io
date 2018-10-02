import appHelpers from './apps'

describe('apps helpers', () => {
  it('should be able to start app if it exists', async () => {
    const ok = { ok: true }
    const mockStart = jest.fn().mockImplementation(successCb => {
      successCb(ok)
    })
    window.startApp = {
      set: () => window.startApp,
      start: mockStart
    }
    appHelpers.checkApp = jest.fn().mockImplementation(async () => {
      return true
    })

    const res = await appHelpers.startApp({
      appId: 'io.cozy.drive.mobile',
      uri: 'cozydrive://'
    })

    expect(appHelpers.checkApp).toHaveBeenCalled()
    expect(res).toBe(ok)
  })
})
