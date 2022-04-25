import appHelpers from './apps'

describe('apps helpers', () => {
  it('should be able to start app if it exists', async () => {
    const ok = { ok: true }
    const mockStart = jest
      .fn()
      .mockImplementation((successCb: ({ ok: boolean }) => void) => {
        successCb(ok)
      })
    window.startApp = {
      // @ts-expect-error ignore startApp mock
      set: (): unknown => window.startApp,
      start: mockStart
    }
    appHelpers.checkApp = jest.fn().mockImplementation(() => {
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
