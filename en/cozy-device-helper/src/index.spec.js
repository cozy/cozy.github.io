import {
  hasDevicePlugin,
  hasInAppBrowserPlugin,
  hasSafariPlugin,
  hasNetworkInformationPlugin
} from './index'

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
  it('should identify has Network  Information plugin', async () => {
    window.cordova = true
    window.navigator.connection = { type: 3 }
    expect(hasNetworkInformationPlugin()).toBeTruthy()
    window.cordova = undefined
    window.navigator.connection = { type: 3 }
    expect(hasNetworkInformationPlugin()).toBeFalsy()
    window.cordova = true
    window.navigator.connection = undefined
    expect(hasNetworkInformationPlugin()).toBeFalsy()
  })
})
