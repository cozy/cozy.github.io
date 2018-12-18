import { hasSafariPlugin, hasInAppBrowserPlugin } from './plugins'

export const nativeLinkOpen = async ({ url }) => {
  if ((await hasSafariPlugin()) && window.SafariViewController) {
    window.SafariViewController.show(
      {
        url: url,
        transition: 'curl'
      },
      result => {
        if (result.event === 'closed') {
          window.SafariViewController.hide()
        }
      },
      () => {
        window.SafariViewController.hide()
      }
    )
  } else if (hasInAppBrowserPlugin()) {
    const target = '_blank'
    const options = 'clearcache=yes,zoom=no'
    window.cordova.InAppBrowser.open(url, target, options)
  } else {
    window.location = url
  }
}
