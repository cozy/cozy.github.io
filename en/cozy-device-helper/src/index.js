export {
  getPlatform,
  isIOSApp,
  isAndroidApp,
  isWebApp,
  isMobileApp,
  isAndroid,
  isIOS,
  isMobile
} from './platform'
export { getDeviceName } from './device'
export { checkApp, startApp } from './apps'
export {
  hasDevicePlugin,
  hasInAppBrowserPlugin,
  hasSafariPlugin
} from './plugins'

export { nativeLinkOpen } from './link'
export { openDeeplinkOrRedirect } from './deeplink'
