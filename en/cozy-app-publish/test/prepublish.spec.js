/* eslint-env jest */
const prepublishLib = require('../lib/prepublish')

const downcloudSpy = jest.fn()
jest.doMock('../lib/hooks/pre/downcloud', () => downcloudSpy)

describe('Prepublish script', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
      prepublishHook: './test/__mocks__/prepublish-unsanitized-hook'
    }
    await expect(prepublishLib(options)).resolves.toMatchSnapshot()
  })

  it('check for undefined mandatory options', async () => {
    const options = {
      ...optionsMock,
      prepublishHook: './test/__mocks__/prepublish-missing-options-hook'
    }
    await expect(prepublishLib(options)).rejects.toThrowErrorMatchingSnapshot()
  })

  it('runs without errors with built-in hook', async () => {
    const options = { ...optionsMock, prepublishHook: 'downcloud' }
    await expect(prepublishLib(options)).resolves.toMatchSnapshot()
    expect(downcloudSpy).toHaveBeenCalled()
  })
})
