import log from 'cozy-logger'
import './url-polyfill'
import { generateUniversalLink } from 'cozy-ui/transpiled/react/AppLinker'
import Handlebars from 'handlebars'

class Notification {
  constructor(config) {
    this.t = config.t
    this.data = config.data
    this.cozyClient = config.cozyClient

    const cozyUrl = this.cozyClient._url

    this.urls = this.constructor.generateURLs(cozyUrl)

    const tGlobal = (key, data) => this.t('Notifications.email.' + key, data)
    Handlebars.registerHelper({ tGlobal })
  }

  static generateURLs(cozyUrl) {
    const commonOpts = { cozyUrl, slug: 'banks' }
    return {
      banksUrl: generateUniversalLink({ ...commonOpts }),
      balancesUrl: generateUniversalLink({
        ...commonOpts,
        nativePath: '/balances'
      }),
      transactionsUrl: generateUniversalLink({
        ...commonOpts,
        nativePath: '/transactions'
      }),
      settingsUrl: generateUniversalLink({
        ...commonOpts,
        nativePath: '/settings/configuration'
      }),
      healthReimbursementsUrl: generateUniversalLink({
        ...commonOpts,
        nativePath: '/balances/reimbursements'
      })
    }
  }

  async sendNotification() {
    if (!this.data) {
      log('info', `Notification hasn't data`)
      return
    }

    try {
      const attributes = await Promise.resolve(
        this.buildNotification(this.data)
      )

      if (!attributes) {
        log('info', `Notification hasn't attributes`)
        return
      }

      log('info', `Send notifications with category: ${attributes.category}`)
      const cozyClient = this.cozyClient
      await cozyClient.fetchJSON('POST', '/notifications', {
        data: {
          type: 'io.cozy.notifications',
          attributes
        }
      })

      if (this.onSendNotificationSuccess) {
        this.onSendNotificationSuccess()
      }
    } catch (err) {
      log('info', `Notification error`)
      log('info', err)
      // eslint-disable-next-line no-console
      console.log(err)
    }
  }
}

export default Notification
