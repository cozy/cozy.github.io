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
