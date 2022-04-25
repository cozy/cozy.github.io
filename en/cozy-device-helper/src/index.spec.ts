import {
  hasDevicePlugin,
  hasInAppBrowserPlugin,
  hasSafariPlugin,
  hasNetworkInformationPlugin
} from './index'

describe('cordova plugins', () => {
  it('should identify has device plugin', () => {
    // @ts-expect-error replace mock with boolean
    window.cordova = true
    // @ts-expect-error replace mock with boolean
    window.device = true
    expect(hasDevicePlugin()).toBeTruthy()
    window.cordova = undefined
    // @ts-expect-error replace mock with boolean
    window.device = true
    expect(hasDevicePlugin()).toBeFalsy()
    // @ts-expect-error replace mock with boolean
    window.cordova = true
    window.device = undefined
    expect(hasDevicePlugin()).toBeFalsy()
  })
  it('should identify has InAppBrowser plugin', () => {
    // @ts-expect-error replace InAppBrowser mock with boolean
    window.cordova = { InAppBrowser: true }
    expect(hasInAppBrowserPlugin()).toBeTruthy()
    // @ts-expect-error replace mock with empty object
    window.cordova = {}
    expect(hasInAppBrowserPlugin()).toBeFalsy()
  })
  it('should identify has Safari plugin', async () => {
    let hasSafari
    // @ts-expect-error replace mock with boolean
    window.cordova = true
    // @ts-expect-error partially mock SafariViewController
    window.SafariViewController = { isAvailable: (f): void => f(true) }
    hasSafari = await hasSafariPlugin()
    expect(hasSafari).toBeTruthy()
    window.cordova = undefined
    // @ts-expect-error partially mock SafariViewController
    window.SafariViewController = { isAvailable: (f): void => f(true) }
    hasSafari = await hasSafariPlugin()
    expect(hasSafari).toBeFalsy()
    // @ts-expect-error replace mock with boolean
    window.cordova = true
    window.SafariViewController = undefined
    hasSafari = await hasSafariPlugin()
    expect(hasSafari).toBeFalsy()
  })
  it('should identify has Network  Information plugin', () => {
    // @ts-expect-error replace mock with boolean
    window.cordova = true
    // @ts-expect-error assign to read only property navigator.connection
    window.navigator.connection = { type: 3 }
    expect(hasNetworkInformationPlugin()).toBeTruthy()
    window.cordova = undefined
    // @ts-expect-error assign to read only property navigator.connection
    window.navigator.connection = { type: 3 }
    expect(hasNetworkInformationPlugin()).toBeFalsy()
    // @ts-expect-error replace mock with boolean
    window.cordova = true
    // @ts-expect-error assign to read only property navigator.connection
    window.navigator.connection = undefined
    expect(hasNetworkInformationPlugin()).toBeFalsy()
  })
})
