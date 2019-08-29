import { getProtocol, getDomain, getApp, getSlug } from './cozyUrl'

describe('getProtocol', () => {
  it('should find protocol', () => {
    expect(getProtocol('https://')).toEqual('https')
    expect(getProtocol('http://')).toEqual('http')
  })
})

describe('getSlug', () => {
  it('should find slug', () => {
    expect(getSlug('https://recette-banks.cozy.works/')).toEqual('recette')
    expect(getSlug('recette-banks.cozy.works')).toEqual('recette')
    expect(getSlug('https://recette.cozy.works')).toEqual('recette')
  })
})

describe('getApp', () => {
  it('should find app name', () => {
    expect(getApp('https://recette-banks.cozy.works/')).toEqual('banks')
    expect(getApp('recette-banks.cozy.works')).toEqual('banks')
  })
})

describe('getDomain', () => {
  it('should find domain', () => {
    expect(getDomain('recette.cozy.works')).toEqual('cozy.works')
    expect(getDomain('http://recette.cozy.works')).toEqual('cozy.works')
    expect(getDomain('https://recette.cozy.works/')).toEqual('cozy.works')
    expect(getDomain('http://banks.cozy.tools:8080/')).toEqual('cozy.tools')
  })
})
