/* eslint-env jest */
const postpublishLib = require('../lib/postpublish')

const mattermostSpy = jest.fn()
jest.doMock('../lib/hooks/post/mattermost', () => mattermostSpy)

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

  // This test is a real test which run a rundeck job, so we do not run it
  // at every build
  // It needs the RUNDECK_TOKEN to be specified

  // it('runs rundeck hook', async () => {
  //   process.env.RUNDECK_TOKEN = 'your token here'
  //   process.env.TARGETS_BETA = 'recette.cozy.works, gregory.cozy.works'
  //   const options = {
  //     ...optionsMock,
  //     appSlug: 'cozy-settings',
  //     appVersion: '2.1.0-beta.1',
  //     postpublishHook: 'rundeck'
  //   }
  //   await expect(postpublishLib(options)).resolves.toMatchObject(options)
  //   delete process.env.RUNDECK_TOKEN
  //   delete process.env.TARGETS_BETA
  // })
})
