/* eslint-env jest */
const postpublishLib = require('./postpublish')

const mattermostSpy = jest.fn()
jest.doMock('./hooks/post/mattermost', () => mattermostSpy)

describe('Postpublish script', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const optionsMock = {
    appBuildUrl: 'http://example.com',
    appSlug: 'cozy-mock',
    appType: 'webapp',
    appVersion: '0.0.0-test',
    registryUrl: 'http://registry.mock/',
    registryEditor: 'Cozy',
    registryToken: 'a5464f54e654c6546b54a56a'
  }

  it('runs without errors with built-in hook', async () => {
    const options = { ...optionsMock, postpublishHook: 'mattermost' }
    await expect(postpublishLib(options)).resolves.toMatchObject(options)
    expect(mattermostSpy).toHaveBeenCalled()
  })
})
