/* eslint-env jest */
const path = require('path')

const publishLib = require('./publish')
const postpublish = require('./postpublish')
const prepublish = require('./prepublish')

const mockAppDir = path.join(__dirname, 'test/mockApps/mockApp')
const mockAppNoEditorDir = path.join(__dirname, 'test/mockApps/mockAppNoEditor')
const getTravisVariables = require('./utils/getTravisVariables')

jest.mock('./publish', () => jest.fn())
jest.mock('./prepublish', () =>
  jest.fn(options => {
    return Object.assign({}, options, { sha256Sum: 'fakeshasum5644545' })
  })
)
jest.mock('./postpublish', () => jest.fn())

const mockCommons = {
  token: 'registryTokenForTest123',
  slug: 'mock-app',
  commitHash: 'f4a98378271c17e91faa9e70a2718c34c04cfc27',
  buildDir: mockAppDir
}

jest.mock('./utils/getTravisVariables')

const travisScript = require('./travis')

function getOptions(buildUrl = null) {
  const options = {
    spaceName: 'mock_space',
    travis: true,
    buildUrl
  }
  return options
}

describe('Travis publishing script', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.console.log = jest.fn()
    // simulate TRAVIS CI environment variables
    getTravisVariables.mockImplementation(() => ({
      TRAVIS_BUILD_DIR: mockCommons.buildDir,
      TRAVIS_TAG: '2.1.8',
      TRAVIS_COMMIT: mockCommons.commitHash,
      TRAVIS_REPO_SLUG: mockCommons.slug,
      // encrypted variables
      REGISTRY_TOKEN: mockCommons.token
    }))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should work correctly if Travis environment variable provided (no TRAVIS_TAG)', async () => {
    getTravisVariables.mockImplementation(() => ({
      TRAVIS_BUILD_DIR: mockCommons.buildDir,
      TRAVIS_TAG: null,
      TRAVIS_COMMIT: mockCommons.commitHash,
      TRAVIS_REPO_SLUG: mockCommons.slug,
      // encrypted variables
      REGISTRY_TOKEN: mockCommons.token
    }))
    jest.spyOn(Date, 'now').mockReturnValue(1551298916519)
    await travisScript(getOptions())
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
    expect(prepublish).toHaveBeenCalledTimes(1)
    expect(postpublish).toHaveBeenCalledTimes(1)
  })

  it('should work correctly with TRAVIS_TAG', async () => {
    await travisScript(getOptions())
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
    expect(prepublish).toHaveBeenCalledTimes(1)
    expect(postpublish).toHaveBeenCalledTimes(1)
  })

  it('should work correctly if --build-url provided', async () => {
    await travisScript(getOptions('https://mock/archive/1.0.0.tar.gz'))
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
    expect(prepublish).toHaveBeenCalledTimes(1)
    expect(postpublish).toHaveBeenCalledTimes(1)
  })

  it('should work correctly if no space name provided', async () => {
    const options = getOptions()
    delete options.spaceName
    await travisScript(options)
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
    expect(prepublish).toHaveBeenCalledTimes(1)
    expect(postpublish).toHaveBeenCalledTimes(1)
  })

  it('should throw an error if the token is missing', async () => {
    getTravisVariables.mockImplementationOnce(() => ({
      TRAVIS_BUILD_DIR: mockCommons.buildDir,
      TRAVIS_TAG: null,
      TRAVIS_COMMIT: mockCommons.commitHash,
      TRAVIS_REPO_SLUG: mockCommons.slug,
      // encrypted variables
      REGISTRY_TOKEN: ''
    }))
    await expect(
      travisScript(getOptions())
    ).rejects.toThrowErrorMatchingSnapshot()
    expect(prepublish).toHaveBeenCalledTimes(0)
    expect(postpublish).toHaveBeenCalledTimes(0)
  })

  it('should throw an error if the editor is missing', async () => {
    getTravisVariables.mockImplementation(() => ({
      TRAVIS_BUILD_DIR: mockAppNoEditorDir,
      TRAVIS_TAG: null,
      TRAVIS_COMMIT: mockCommons.commitHash,
      TRAVIS_REPO_SLUG: mockCommons.slug,
      // encrypted variables
      REGISTRY_TOKEN: mockCommons.token
    }))
    await expect(
      travisScript(getOptions())
    ).rejects.toThrowErrorMatchingSnapshot()
    expect(prepublish).toHaveBeenCalledTimes(0)
    expect(postpublish).toHaveBeenCalledTimes(0)
  })

  it('should fail on prePublish error', async () => {
    const options = getOptions()
    prepublish.mockRejectedValueOnce(new Error('Prepublish test error'))
    await expect(travisScript(options)).rejects.toMatchSnapshot()
    expect(prepublish).toHaveBeenCalledTimes(1)
    expect(publishLib).toHaveBeenCalledTimes(0)
    expect(postpublish).toHaveBeenCalledTimes(0)
  })

  it('should fail on publish error', async () => {
    const options = getOptions()
    publishLib.mockRejectedValueOnce(new Error('Publish test error'))
    await expect(travisScript(options)).rejects.toMatchSnapshot()
    expect(prepublish).toHaveBeenCalledTimes(1)
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(postpublish).toHaveBeenCalledTimes(0)
  })

  it('should fail on postPublish error', async () => {
    const options = getOptions()
    postpublish.mockRejectedValueOnce(new Error('Postpublish test error'))
    await expect(travisScript(options)).rejects.toMatchSnapshot()
    expect(prepublish).toHaveBeenCalledTimes(1)
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(postpublish).toHaveBeenCalledTimes(1)
  })

  it('should support prefix', async () => {
    const badTag = 'cozy-banks/2.1.8-beta.1'
    const goodTag = 'cozy-drive/2.1.8-beta.2'
    jest.spyOn(global.Date, 'now').mockReturnValue(123456)
    for (const tag of [badTag, goodTag]) {
      publishLib.mockReset()
      getTravisVariables.mockImplementation(() => ({
        TRAVIS_BUILD_DIR: mockCommons.buildDir,
        TRAVIS_TAG: tag,
        TRAVIS_COMMIT: mockCommons.commitHash,
        TRAVIS_REPO_SLUG: mockCommons.slug,
        // encrypted variables
        REGISTRY_TOKEN: mockCommons.token
      }))
      const options = getOptions()
      await travisScript({ ...options, tagPrefix: 'cozy-drive' })
      expect(publishLib).toHaveBeenCalledTimes(1)
      expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
    }
  })
})
