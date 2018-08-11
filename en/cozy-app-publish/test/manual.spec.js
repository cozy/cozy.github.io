/* eslint-env jest */
const fs = require('fs-extra')
const path = require('path')

const manualScript = require('../lib/manual')
const publishLib = require('../lib/publish')
// const prepublishLib = require('../lib/prepublish')

const rootPath = process.cwd()
const testFolder = '.tmp_test'
const testPath = path.join(rootPath, testFolder)
const mockAppDir = path.join(__dirname, 'mockApps/mockApp')

jest.mock('../lib/publish', () => jest.fn())
jest.mock('../lib/prepublish', () =>
  jest.fn(options =>
    Object.assign({}, options, { sha256Sum: 'fakeshasum5644545' })
  )
)

const commons = {
  token: 'registryTokenForTest123'
}

function getOptions(token, buildDir) {
  const options = {
    registryToken: token,
    appBuildUrl: 'https://mock.getarchive.cc/12345.tar.gz',
    manualVersion: '2.1.8-dev.12345',
    registryUrl: 'https://mock.registry.cc',
    spaceName: 'mock_space'
  }
  if (buildDir) options.buildDir = buildDir
  return options
}

describe('Manual publishing script', () => {
  beforeAll(() => {
    // create the app test folder
    fs.ensureDirSync(testPath)
    process.chdir(testPath)
    // copy the app mock content
    fs.copySync(mockAppDir, testPath, { overwrite: true })
  })

  afterAll(() => {
    // get out of the test folder
    process.chdir('..')
    // remove the test folder
    fs.removeSync(testPath)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should work correctly if expected options provided', async () => {
    await manualScript(getOptions(commons.token, './build'), { confirm: 'yes' })
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
  })

  it('should work correctly with default buildDir value "build"', async () => {
    await manualScript(getOptions(commons.token), { confirm: 'yes' })
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
  })

  it('should work correctly if no space name provided', async () => {
    const options = getOptions(commons.token)
    delete options.spaceName

    await manualScript(options, { confirm: 'yes' })
    expect(publishLib).toHaveBeenCalledTimes(1)
    expect(publishLib.mock.calls[0][0]).toMatchSnapshot()
  })

  it('should handle error if the publishing is canceled by the user via the prompt and not publishing', async () => {
    await manualScript(getOptions(commons.token), { confirm: 'no' })
    expect(publishLib).toHaveBeenCalledTimes(0)
  })

  it('should throw an error if the token is missing', async () => {
    await expect(
      manualScript(getOptions(null), { confirm: 'yes' })
    ).rejects.toThrowErrorMatchingSnapshot()
  })
})
