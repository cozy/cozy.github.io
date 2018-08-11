/* eslint-env jest */
const fetch = require('jest-fetch-mock')

const publish = require('../lib/publish')

function getOptions() {
  const options = {
    registryEditor: 'cozy',
    registryToken: 'registryTokenForTest123',
    appSlug: 'mock-app',
    appBuildUrl: 'https://mock.getarchive.cc/12345.tar.gz',
    appVersion: '2.1.8-dev.12345',
    registryUrl: 'https://mock.registry.cc',
    spaceName: 'mock_space',
    appType: 'webapp',
    sha256Sum:
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  }
  return options
}

function getObjectToSnapshot(fetchMock, callNumber = 0) {
  return {
    fetchURL: fetchMock.mock.calls[callNumber][0],
    options: fetchMock.mock.calls[callNumber][1]
  }
}

describe('Publish script (helper)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should work correctly if expected options provided', async () => {
    fetch.mockResponseOnce('', {
      status: 201
    })
    await publish(getOptions())
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(getObjectToSnapshot(fetch)).toMatchSnapshot()
  })

  it('should work correctly if no space name provided', async () => {
    fetch.mockResponseOnce('', {
      status: 201
    })
    const options = getOptions()
    delete options.spaceName
    await publish(options)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(getObjectToSnapshot(fetch)).toMatchSnapshot()
  })

  it('should handle error message if the publishing failed with 404', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({ error: 'Application slug not found' }),
      {
        status: 404,
        statusText: '(TEST) Not Found'
      }
    )

    expect(publish(getOptions())).rejects.toThrowErrorMatchingSnapshot()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should handle error message if the publishing failed with an unexpected fetch error', async () => {
    fetch.mockRejectOnce(new Error('(TEST) Unexpected error'))
    expect(publish(getOptions())).rejects.toThrowErrorMatchingSnapshot()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
