import {
  isWebApp,
  isMobileApp,
  isIOSApp,
  isAndroidApp,
  getPlatform,
  hasDevicePlugin,
  hasInAppBrowserPlugin,
  hasSafariPlugin
} from './index'

describe('platforms', () => {
  it('should identify is a web application', () => {
    expect(isWebApp()).toBeTruthy()
  })
  it('should identify is a mobile application', () => {
    window.cordova = true
    expect(isMobileApp()).toBeTruthy()
    window.cordova = undefined
    expect(isMobileApp()).toBeFalsy()
  })
  it('should identify is an iOS or Android application', () => {
    window.cordova = { platformId: 'ios' }
    expect(isIOSApp()).toBeTruthy()
    expect(isAndroidApp()).toBeFalsy()
    window.cordova = { platformId: 'android' }
    expect(isIOSApp()).toBeFalsy()
    expect(isAndroidApp()).toBeTruthy()
  })
  it('should return platform', () => {
    window.cordova = undefined
    expect(getPlatform()).toEqual('web')
    window.cordova = { platformId: 'ios' }
    expect(getPlatform()).toEqual('ios')
    window.cordova = { platformId: 'android' }
    expect(getPlatform()).toEqual('android')
  })
})

describe('cordova plugins', () => {
  it('should identify has device plugin', () => {
    window.cordova = true
    window.device = true
    expect(hasDevicePlugin()).toBeTruthy()
    window.cordova = undefined
    window.device = true
    expect(hasDevicePlugin()).toBeFalsy()
    window.cordova = true
    window.device = undefined
    expect(hasDevicePlugin()).toBeFalsy()
  })
  it('should identify has InAppBrowser plugin', () => {
    window.cordova = { InAppBrowser: true }
    expect(hasInAppBrowserPlugin()).toBeTruthy()
    window.cordova = {}
    expect(hasInAppBrowserPlugin()).toBeFalsy()
  })
  it('should identify has Safari plugin', async () => {
    let hasSafari
    window.cordova = true
    window.SafariViewController = { isAvailable: f => f(true) }
    hasSafari = await hasSafariPlugin()
    expect(hasSafari).toBeTruthy()
    window.cordova = undefined
    window.SafariViewController = { isAvailable: f => f(true) }
    hasSafari = await hasSafariPlugin()
    expect(hasSafari).toBeFalsy()
    window.cordova = true
    window.SafariViewController = undefined
    hasSafari = await hasSafariPlugin()
    expect(hasSafari).toBeFalsy()
  })
})
