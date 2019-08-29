import Handlebars from 'handlebars'
import htmlTemplate from './html/balance-lower-html'
import * as utils from './html/utils'
import Notification from './Notification'
import log from 'cozy-logger'
import { getAccountBalance } from 'ducks/account/helpers'
import { getCurrencySymbol } from 'utils/currencySymbol'

const addCurrency = o => ({ ...o, currency: '€' })

const INSTITUTION_SEL = '.js-institution'
const ACCOUNT_SEL = '.js-account'

const toText = cozyHTMLEmail => {
  const getContent = $ =>
    $([ACCOUNT_SEL, INSTITUTION_SEL].join(', '))
      .toArray()
      .map(node => {
        const $node = $(node)
        if ($node.is(INSTITUTION_SEL)) {
          return '\n ### ' + $node.text() + '\n'
        } else if ($node.is(ACCOUNT_SEL)) {
          return (
            '- ' +
            $node
              .find('td')
              .map((i, td) =>
                $(td)
                  .text()
                  .replace(/\n/g, '')
                  .replace(' €', '€')
                  .trim()
              )
              .toArray()
              .join(' ')
          )
        }
      })
      .join('\n')
  return utils.toText(cozyHTMLEmail, getContent)
}

class BalanceLower extends Notification {
  constructor(config) {
    super(config)
    log('info', `value of lowerBalance: ${config.value}`)
    this.lowerBalance = config.value
  }

  filter(account) {
    // TODO: Find why account is undefined?
    return (
      getAccountBalance(account) < this.lowerBalance &&
      account.type !== 'CreditCard' // CreditCard are always in negative balance
    )
  }

  buildNotification({ accounts }) {
    const accountsFiltered = accounts
      .filter(acc => this.filter(acc))
      .map(addCurrency)
    if (accountsFiltered.length === 0) {
      log('info', 'BalanceLower: no matched accounts')
      return
    }

    log('info', `BalanceLower: ${accountsFiltered.length} accountsFiltered`)

    Handlebars.registerHelper({ t: this.t })
    Handlebars.registerHelper({ getAccountBalance })

    const onlyOne = accountsFiltered.length === 1
    const firstAccount = accountsFiltered[0]

    const templateData = {
      accounts: accountsFiltered,
      urls: this.urls
    }

    const titleData = onlyOne
      ? {
          balance: firstAccount.balance,
          currency: '€',
          label: firstAccount.shortLabel || firstAccount.label
        }
      : {
          accountsLength: accountsFiltered.length,
          lowerBalance: this.lowerBalance,
          currency: '€'
        }

    const titleKey = `Notifications.if_balance_lower.notification.${
      onlyOne ? 'one' : 'several'
    }.title`
    const title = this.t(titleKey, titleData)

    const contentHTML = htmlTemplate(templateData)

    return {
      category: 'balance-lower',
      title,
      message: this.getPushContent(accountsFiltered),
      preferred_channels: ['mail', 'mobile'],
      content: toText(contentHTML),
      content_html: contentHTML,
      data: {
        route: '/balances'
      }
    }
  }

  getPushContent(accounts) {
    const [account] = accounts
    const balance = getAccountBalance(account)

    return `${account.label} (${
      balance > 0 ? '+' : ''
    }${balance} ${getCurrencySymbol(account.currency)})`
  }
}

BalanceLower.settingKey = 'balanceLower'
BalanceLower.isValidConfig = config => Number.isFinite(config.value)

export default BalanceLower
