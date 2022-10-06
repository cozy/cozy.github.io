const tags = require('./tags')

describe('parse', () => {
  it('should correctly parse a stable version', () => {
    const tagInfo = tags.parse('v1.0.0')
    expect(tagInfo.version).toBe('1.0.0')
    expect(tagInfo.channel).toBe('stable')
    expect(tagInfo.dev).toBe(null)
    expect(tagInfo.beta).toBe(null)
    expect(tagInfo.fullVersion).toBe('1.0.0')
  })

  it('should correctly parse a beta version', () => {
    const tagInfo = tags.parse('v1.0.0-beta.1')
    expect(tagInfo.version).toBe('1.0.0')
    expect(tagInfo.channel).toBe('beta')
    expect(tagInfo.beta).toBe(1)
    expect(tagInfo.fullVersion).toBe('1.0.0-beta.1')
  })

  it('should correctly parse a dev version', () => {
    const tagInfo = tags.parse('v1.0.0-dev.deadbeef1456')
    expect(tagInfo.version).toBe('1.0.0')
    expect(tagInfo.dev).toBe('deadbeef1456')
    expect(tagInfo.beta).toBe(null)
    expect(tagInfo.channel).toBe('dev')
    expect(tagInfo.fullVersion).toBe('1.0.0-dev.deadbeef1456')
  })

  it('should correctly parse a version without vendor', () => {
    const tagInfo = tags.parse('v1.0.0-dev.deadbeef1456')
    expect(tagInfo.version).toBe('1.0.0')
    expect(tagInfo.dev).toBe('deadbeef1456')
    expect(tagInfo.beta).toBe(null)
    expect(tagInfo.channel).toBe('dev')
  })

  it('should correctly parse a version with prefix', () => {
    const tagInfo = tags.parse('cozy-banks/v1.0.0-dev.deadbeef1456')
    expect(tagInfo.prefix).toBe('cozy-banks')
    expect(tagInfo.version).toBe('1.0.0')
    expect(tagInfo.dev).toBe('deadbeef1456')
    expect(tagInfo.beta).toBe(null)
    expect(tagInfo.channel).toBe('dev')
  })
})
