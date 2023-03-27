import { NotificationView } from 'cozy-notifications'
import { generateUniversalLink } from 'cozy-ui/transpiled/react/AppLinker'
import get from 'lodash/get'
import bankLayout from './bank-layout.hbs'
import { helpers } from './index'

/**
 * Provides common data, helpers and partials to all notification views
 * used in banks
 */
class BaseNotificationView extends NotificationView {
  constructor(options) {
    super(options)
    const cozyUrl = this.client.stackClient.uri
    this.urls = this.constructor.generateURLs(cozyUrl)
  }

  static generateURLs(cozyUrl) {
    const commonOpts = { cozyUrl, slug: 'banks' }
    return {
      homeUrl: generateUniversalLink({ cozyUrl, slug: 'home' }),
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

  getHelpers() {
    return helpers
  }

  getPartials() {
    return {
      'bank-layout': bankLayout
    }
  }

  getExtraAttributes() {
    return {
      data: {
        source: get(this.client, 'appMetadata.slug'),
        appName: 'Banks'
      }
    }
  }
}

export default BaseNotificationView
