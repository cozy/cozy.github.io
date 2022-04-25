import {
  isWebApp,
  isMobileApp,
  isIOSApp,
  isAndroidApp,
  getPlatform
} from './platform'

describe('platforms', () => {
  it('should identify is a web application', () => {
    expect(isWebApp()).toBeTruthy()
  })
  it('should identify is a mobile application', () => {
    // @ts-expect-error replace mock with boolean
    window.cordova = true
    expect(isMobileApp()).toBeTruthy()
    window.cordova = undefined
    expect(isMobileApp()).toBeFalsy()
  })
  it('should identify is an iOS or Android application', () => {
    // @ts-expect-error do not mock InAppBrowser
    window.cordova = { platformId: 'ios' }
    expect(isIOSApp()).toBeTruthy()
    expect(isAndroidApp()).toBeFalsy()
    // @ts-expect-error do not mock InAppBrowser
    window.cordova = { platformId: 'android' }
    expect(isIOSApp()).toBeFalsy()
    expect(isAndroidApp()).toBeTruthy()
  })
  it('should return platform', () => {
    window.cordova = undefined
    expect(getPlatform()).toEqual('web')
    // @ts-expect-error do not mock InAppBrowser
    window.cordova = { platformId: 'ios' }
    expect(getPlatform()).toEqual('ios')
    // @ts-expect-error do not mock InAppBrowser
    window.cordova = { platformId: 'android' }
    expect(getPlatform()).toEqual('android')
  })
})
