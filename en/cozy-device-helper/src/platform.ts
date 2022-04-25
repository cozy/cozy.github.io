import { isCordova } from './cordova'

const ANDROID_PLATFORM = 'android'
const IOS_PLATFORM = 'ios'
const WEB_PLATFORM = 'web'

type PLATFORM =
  | typeof ANDROID_PLATFORM
  | typeof IOS_PLATFORM
  | typeof WEB_PLATFORM

export const getPlatform = (): PLATFORM =>
  isCordova() ? window.cordova.platformId : WEB_PLATFORM
const isPlatform = (platform: PLATFORM): boolean => getPlatform() === platform
export const isIOSApp = (): boolean => isPlatform(IOS_PLATFORM)
export const isAndroidApp = (): boolean => isPlatform(ANDROID_PLATFORM)
export const isWebApp = (): boolean => isPlatform(WEB_PLATFORM)
export const isMobileApp = (): boolean => isCordova()

// return if is on an Android Device (native or browser)
export const isAndroid = (): boolean =>
  window.navigator.userAgent &&
  window.navigator.userAgent.indexOf('Android') >= 0
// return if is on an iOS Device (native or browser)
export const isIOS = (): boolean =>
  window.navigator.userAgent &&
  /iPad|iPhone|iPod/.test(window.navigator.userAgent)

// isMobile checks if the user is on a smartphone : native app or browser
export const isMobile = (): boolean => isAndroid() || isIOS()
