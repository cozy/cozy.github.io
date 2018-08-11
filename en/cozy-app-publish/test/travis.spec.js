/* eslint-env jest */
const path = require('path')

const publishLib = require('../lib/publish')
const postpublish = require('../lib/postpublish')
const prepublish = require('../lib/prepublish')

const mockAppDir = path.join(__dirname, 'mockApps/mockApp')
const mockAppNoEditorDir = path.join(__dirname, 'mockApps/mockAppNoEditor')
const getTravisVariables = require('../utils/getTravisVariables')

jest.mock('../lib/publish', () => jest.fn())
jest.mock('../lib/prepublish', () =>
  jest.fn(options => {
    return Object.assign({}, options, { sha256Sum: 'fakeshasum5644545' })
  })
)
jest.mock('../lib/postpublish', () => jest.fn())

const mockCommons = {
  token: 'registryTokenForTest123',
  slug: 'mock-app',
  commitHash: 'f4a98378271c17e91faa9e70a2718c34c04cfc27',
  buildDir: mockAppDir
}

// simulate TRAVIS CI environment variables
jest.mock('../utils/getTravisVariables', () =>
  jest.fn().mockImplementation(() => ({
    TRAVIS_BUILD_DIR: mockCommons.buildDir,
    TRAVIS_TAG: '2.1.8',
    TRAVIS_COMMIT: mockCommons.commitHash,
    TRAVIS_REPO_SLUG: mockCommons.slug,
    // encrypted variables
    REGISTRY_TOKEN: mockCommons.token
  }))
)

const travisScript = require('../lib/travis')

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
  })

  it('should work correctly if Travis environment variable provided (no TRAVIS_TAG)', async () => {
    getTravisVariables.mockImplementationOnce(() => ({
      TRAVIS_BUILD_DIR: mockCommons.buildDir,
      TRAVIS_TAG: null,
      TRAVIS_COMMIT: mockCommons.commitHash,
      TRAVIS_REPO_SLUG: mockCommons.slug,
      // encrypted variables
      REGISTRY_TOKEN: mockCommons.token
    }))
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
    getTravisVariables.mockImplementationOnce(() => ({
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

  it('should handle correctly errored postpublish', async () => {
    const options = getOptions()
    postpublish.mockRejectedValueOnce(new Error('(TEST) Postpublish error'))
    await expect(travisScript(options)).resolves
    expect(prepublish).toHaveBeenCalledTimes(1)
    expect(postpublish).toHaveBeenCalledTimes(1)
  })
})
