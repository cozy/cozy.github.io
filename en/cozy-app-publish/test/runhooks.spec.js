/* eslint-env jest */
const runHooks = require('../utils/runhooks')

describe('RunHooks', () => {
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

  it('handles hook', async () => {
    await expect(
      runHooks('./test/__mocks__/hook', 'pre', optionsMock)
    ).resolves.toMatchSnapshot()
  })

  it('throws error on invalid prepublish hook path', async () => {
    await expect(
      runHooks('./test/__mocks__/not-existing-hook', 'post', optionsMock)
    ).rejects.toMatchSnapshot()
  })

  it('throws error when prepublish hook throws error', async () => {
    await expect(
      runHooks('./test/__mocks__/errored-hook', 'pre', optionsMock)
    ).rejects.toMatchSnapshot()
  })
})
