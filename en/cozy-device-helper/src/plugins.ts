import { isCordova } from './cordova'

export const hasDevicePlugin = (): boolean => {
  return isCordova() && window.device !== undefined
}
export const hasInAppBrowserPlugin = (): boolean => {
  return isCordova() && window.cordova.InAppBrowser !== undefined
}
export const hasSafariPlugin = (): Promise<boolean> => {
  return new Promise(resolve => {
    if (!isCordova() || window.SafariViewController === undefined) {
      resolve(false)
      return
    }

    window.SafariViewController.isAvailable(available => resolve(available))
  })
}

/**
 * Check if the Cordova's cordova-plugin-network-information plugin is installed
 * @see https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-network-information/
 * @returns {boolean}
 */
export const hasNetworkInformationPlugin = (): boolean => {
  // @ts-expect-error Don't bother, method that will be removed soon
  return isCordova() && window.navigator.connection !== undefined
}
