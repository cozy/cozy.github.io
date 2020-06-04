import cozyBar from 'utils/cozyBar'
import iconBanks from 'targets/favicons/icon-banks.svg'

const getLang = () =>
  navigator && navigator.language ? navigator.language.slice(0, 2) : 'en'

/**
 * Bar plugin for CozyClient
 *
 * Registers lifecycle handlers to
 *
 * - initialize the bar on login
 * - destroy it on logout
 */
export default async client => {
  // Need to override the default logout from the bar
  const handleMobileLogout = async () => {
    try {
      await client.logout()
    } finally {
      client.emit('logout')
    }
  }

  await cozyBar.init({
    appNamePrefix: 'Cozy',
    appName: 'Banks',
    appEditor: 'Cozy',
    appSlug: 'banks',
    cozyClient: client,
    cozyURL: client.uri,
    iconPath: iconBanks,
    lang: getLang(),
    replaceTitleOnMobile: true,
    onLogOut: handleMobileLogout
  })

  client.on('logout', () => {
    if (document.getElementById('coz-bar')) {
      document.getElementById('coz-bar').remove()
      document.body.setAttribute('style', '')
    }
  })
}
