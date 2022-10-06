const { getFullAppVersion, getRemoteDir, getAppBuildUrl } = require('./helpers')

describe('getFullAppVersion', () => {
  it('should return the good version if no buildCommit is specified', () => {
    expect(getFullAppVersion({ appVersion: '1.2.3-dev.abcdef' })).toBe(
      '1.2.3-dev.abcdef'
    )

    expect(getFullAppVersion({ appVersion: '1.2.3-beta.1' })).toBe(
      '1.2.3-beta.1'
    )

    expect(getFullAppVersion({ appVersion: '1.2.3' })).toBe('1.2.3')
  })

  it('should return the good version if buildCommit is specified', () => {
    const buildCommit = '12345abcdef'

    expect(
      getFullAppVersion({ appVersion: '1.2.3-dev.abcdef', buildCommit })
    ).toBe('1.2.3-dev.abcdef-12345abcdef')

    expect(getFullAppVersion({ appVersion: '1.2.3-beta.1', buildCommit })).toBe(
      '1.2.3-beta.1-12345abcdef'
    )

    expect(getFullAppVersion({ appVersion: '1.2.3', buildCommit })).toBe(
      '1.2.3-12345abcdef'
    )
  })
})

describe('getRemoteUploadPath', () => {
  it('Should return the good dir if no space is specified', () => {
    expect(getRemoteDir({ appSlug: 'test', appVersion: '1.2.3' })).toBe(
      'test/1.2.3'
    )
  })

  it('should return the good dir if space is specified', () => {
    expect(
      getRemoteDir({
        appSlug: 'test',
        appVersion: '1.2.3',
        spaceName: 'space'
      })
    ).toBe('space/test/1.2.3')
  })
})

describe('getAppBuildUrl', () => {
  it('should return the good URL', () => {
    expect(getAppBuildUrl('space/test/1.2.3/test.tar.gz')).toBe(
      'https://downcloud.cozycloud.cc/upload/space/test/1.2.3/test.tar.gz'
    )

    expect(getAppBuildUrl('test/1.2.3/test.tar.gz')).toBe(
      'https://downcloud.cozycloud.cc/upload/test/1.2.3/test.tar.gz'
    )
  })
})
