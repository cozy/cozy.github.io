/**
 * This file is used to open the native app from a webapp
 * if this native app is installed
 *
 * From a webapp, we don't have any clue if a native app is installed.
 * The only way to know that, is to try to open the custom link
 * (aka cozydrive://) and if nothing happens (no blur) we redirect to
 * the callback
 *
 * Firefox tries to open custom link, so we need to create an iframe
 * to detect if this is supported or not
 */
const _createHiddenIframe = (target, uri, randomId) => {
  const iframe = document.createElement('iframe')
  iframe.src = uri
  iframe.id = `hiddenIframe_${randomId}`
  iframe.style.display = 'none'
  target.appendChild(iframe)
  return iframe
}

const openUriWithHiddenFrame = (uri, failCb) => {
  const randomId = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5)
  window.addEventListener('blur', onBlur)
  let iframe = _createHiddenIframe(document.body, 'about:blank', randomId)

  const timeout = setTimeout(function() {
    failCb()
    window.removeEventListener('blur', onBlur)
    iframe.parentElement.removeChild(iframe)
  }, 500)

  function onBlur() {
    clearTimeout(timeout)
    window.removeEventListener('blur', onBlur)
    iframe.parentElement.removeChild(iframe)
  }

  iframe.contentWindow.location.href = uri
}

const openUriWithTimeoutHack = (uri, failCb) => {
  const timeout = setTimeout(function() {
    failCb()
    target.removeEventListener('blur', onBlur)
  }, 500)

  //handle page running in an iframe (blur must be registered with top level window)
  let target = window
  while (target != target.parent) {
    target = target.parent
  }
  target.addEventListener('blur', onBlur)

  function onBlur() {
    clearTimeout(timeout)
    target.removeEventListener('blur', onBlur)
  }

  window.location = uri
}

const openUriWithMsLaunchUri = (uri, failCb) => {
  navigator.msLaunchUri(uri, undefined, failCb)
}

const checkBrowser = () => {
  const isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0
  const ua = navigator.userAgent.toLowerCase()
  const isSafari =
    (ua.includes('safari') && !ua.includes('chrome')) ||
    Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') >
      0
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

  const isIOS122 = isIOS && (ua.includes('os 12_2') || ua.includes('os 12_3'))
  return {
    isOpera,
    isFirefox: typeof InstallTrigger !== 'undefined',
    isSafari,
    isChrome: !!window.chrome && !isOpera,
    isIOS122,
    isIOS
  }
}

/**
 *
 * @param {String} deeplink (cozydrive://)
 * @param {String} failCb (http://drive.cozy.ios)
 */
export const openDeeplinkOrRedirect = (deeplink, failCb) => {
  if (navigator.msLaunchUri) {
    //for IE and Edge in Win 8 and Win 10
    openUriWithMsLaunchUri(deeplink, failCb)
  } else {
    const browser = checkBrowser()

    if (browser.isChrome || (browser.isIOS && !browser.isIOS122)) {
      openUriWithTimeoutHack(deeplink, failCb)
    } else if ((browser.isSafari && !browser.isIOS122) || browser.isFirefox) {
      openUriWithHiddenFrame(deeplink, failCb)
    } else {
      failCb()
    }
  }
}
