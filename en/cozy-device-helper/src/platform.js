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
