const getClient = require('./getClient')

jest.mock('fs', () => ({
  existsSync: () => true
}))

describe('getClient', () => {
  beforeEach(() => {
    jest
      .spyOn(getClient.exported, 'getClientWithToken')
      .mockImplementation(() => async () => {
        throw new Error(
          'Could not create client with token due to unknown error'
        )
      })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should throw a chained error', async () => {
    await expect(
      getClient('./token-path', 'https://test.mycozy.cloud', [
        'io.cozy.accounts'
      ])
    ).rejects.toMatchObject({
      message: 'Could not create client',
      stack: expect.stringContaining(
        'Could not create client with token due to unknown error'
      )
    })
  })
})
