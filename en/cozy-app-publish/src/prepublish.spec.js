/* eslint-env jest */
const prepublishLib = require('./prepublish')

const downcloudSpy = jest.fn()
jest.doMock('./hooks/pre/downcloud', () => downcloudSpy)

describe('Prepublish script', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .spyOn(prepublishLib, 'shasum256FromURL')
      .mockResolvedValue(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const optionsMock = {
    appBuildUrl: 'http://example.mock',
    appSlug: 'cozy-mock',
    appType: 'webapp',
    appVersion: '0.0.1',
    registryUrl: 'http://registry.mock/',
    registryEditor: 'Cozy',
    registryToken: 'a5464f54e654c6546b54a56a'
  }

  it('generates sha256', async () => {
    await expect(prepublishLib(optionsMock)).resolves.toMatchSnapshot()
  })

  it('sanitize options from hook script', async () => {
    const options = {
      ...optionsMock,
      prepublishHook: './src/__mocks__/prepublish-unsanitized-hook'
    }
    await expect(prepublishLib(options)).resolves.toMatchSnapshot()
  })

  it('check for undefined mandatory options', async () => {
    const options = {
      ...optionsMock,
      prepublishHook: './src/__mocks__/prepublish-missing-options-hook'
    }
    await expect(prepublishLib(options)).rejects.toThrowErrorMatchingSnapshot()
  })

  it('check for undefined manifest mandatory options', async () => {
    const options = {
      ...optionsMock,
      prepublishHook: './src/__mocks__/prepublish-missing-manifest-options-hook'
    }
    await expect(prepublishLib(options)).rejects.toThrowErrorMatchingSnapshot()
  })

  it('check for bad values in options', async () => {
    const options = {
      ...optionsMock,
      prepublishHook: './src/__mocks__/prepublish-bad-value-options-hook'
    }
    await expect(prepublishLib(options)).rejects.toThrowErrorMatchingSnapshot()
  })

  it('runs without errors with built-in hook', async () => {
    const options = { ...optionsMock, prepublishHook: 'downcloud' }
    await expect(prepublishLib(options)).resolves.toMatchSnapshot()
    expect(downcloudSpy).toHaveBeenCalled()
  })
})

if (process.env.TEST_INTEGRATION) {
  describe('shasum', () => {
    it('should do a correct shasum, following redirections', async () => {
      const url =
        'https://github.com/konnectors/rtm/archive/b1e77ca0d9d76b682b87ae4114669b11953083d0.tar.gz'
      const sha = await prepublishLib.shasum256FromURL(url)
      expect(sha).toBe(
        '7d9b75938613af486f27a58f5423e52eab566e32de2a77a863facc84c63f41ae'
      )
    })
  })
}
