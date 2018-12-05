import { isCordova } from './cordova'

const WEB_PLATFORM = 'web'
const IOS_PLATFORM = 'ios'
const ANDROID_PLATFORM = 'android'

export const getPlatform = () =>
  isCordova() ? window.cordova.platformId : WEB_PLATFORM
const isPlatform = platform => getPlatform() === platform
export const isIOSApp = () => isPlatform(IOS_PLATFORM)
export const isAndroidApp = () => isPlatform(ANDROID_PLATFORM)
export const isWebApp = () => isPlatform(WEB_PLATFORM)
export const isMobileApp = () => isCordova()

//return if is on an Android Device (native or browser)
export const isAndroid = () =>
  window.navigator.userAgent &&
  window.navigator.userAgent.indexOf('Android') >= 0
//return if is on an iOS Device (native or browser)
export const isIOS = () =>
  window.navigator.userAgent &&
  /iPad|iPhone|iPod/.test(window.navigator.userAgent)

//isMobile checks if the user is on a smartphone : native app or browser
export const isMobile = () => isAndroid() || isIOS()
