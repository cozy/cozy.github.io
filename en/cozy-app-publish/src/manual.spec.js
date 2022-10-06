/* eslint-env jest */
const fs = require('fs-extra')
const path = require('path')

const manualScript = require('./manual').manualPublish
const publishLib = require('./publish')
const prepublish = require('./prepublish')
const tags = require('./tags')

const rootPath = process.cwd()
const testFolder = '.tmp_test'
const testPath = path.join(rootPath, testFolder)

const mockAppDir = path.join(__dirname, 'test/mockApps/mockApp')
const promptConfirm = require('./confirm')

jest.mock('./confirm')
jest.mock('./publish', () => jest.fn())

jest.mock('./hooks/pre/downcloud', () => ({
  appBuildUrl: 'https://mock.getarchive.cc/12345.tar.gz'
}))
jest.mock('./prepublish', () => jest.fn())

const commons = {
  token: 'registryTokenForTest123'
}

function getOptions(token, buildDir) {
  const options = {
    registryToken: token,
    appBuildUrl: 'https://mock.getarchive.cc/12345.tar.gz',
    manualVersion: '2.1.8-dev.12345',
    registryUrl: 'https://mock.registry.cc',
    spaceName: 'mock_space',
    yes: true
  }
  if (buildDir) {
    options.buildDir = buildDir
  }
  return options
}

describe('Manual publishing script', () => {
  beforeAll(() => {
    // create the app test folder
    fs.ensureDirSync(testPath)
    process.chdir(testPath)
    // copy the app mock content
    fs.copySync(mockAppDir, testPath, { overwrite: true })
    tags.getVersionTags = jest
      .fn()
      .mockReturnValue(['2.1.8-dev.12346'].map(tags.parse))
  })

  afterAll(() => {
    // get out of the test folder
    process.chdir('..')
    // remove the test folder
    fs.removeSync(testPath)
  })

  let prepublishResult
  beforeEach(() => {
    jest.clearAllMocks()
    prepublishResult = { sha256Sum: 'fakeshasum5644545' }
    prepublish.mockImplementation(options =>
      Object.assign({}, options, prepublishResult)
    )
  })

  it('should work correctly if expected options provided', async () => {
    await manualScript(getOptions(commons.token, './build'))
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
  })

  it('should work correctly with default buildDir value "build"', async () => {
    await manualScript(getOptions(commons.token))
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
  })

  it('should work correctly if no space name provided', async () => {
    const options = getOptions(commons.token)
    delete options.spaceName

    await manualScript(options)
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
  })

  it('should work correctly if no version provided', async () => {
    const options = getOptions(commons.token)
    delete options.manualVersion

    await manualScript(options)
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
  })

  it('should work correctly if no appBuildUrl is provided but prepublish provides it', async () => {
    const options = getOptions(commons.token)
    delete options.appBuildUrl
    prepublishResult.appBuildUrl = 'https://mock.getarchive.cc/12345.tar.gz'

    await manualScript(options)
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
  })

  it('should handle error if the publishing is canceled by the user via the prompt and not publishing', async () => {
    promptConfirm.mockImplementation(() => Promise.resolve(false))
    const options = getOptions(commons.token)
    await manualScript({ ...options, yes: false })
    expect(publishLib).toHaveBeenCalledTimes(0)
  })

  it('should throw an error if the token is missing', async () => {
    await expect(
      manualScript(getOptions(null))
    ).rejects.toThrowErrorMatchingSnapshot()
  })

  it('should support prefix', async () => {
    const badTag = 'cozy-banks/2.1.8-beta.1'
    const goodTag = 'cozy-drive/2.1.8-beta.2'
    const tagVersions = [badTag, goodTag].map(tags.parse)
    tags.getVersionTags = jest.fn().mockReturnValue(tagVersions)
    await manualScript({
      ...getOptions(commons.token),
      manualVersion: null,
      tagPrefix: 'cozy-drive'
    })
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
  })
})
