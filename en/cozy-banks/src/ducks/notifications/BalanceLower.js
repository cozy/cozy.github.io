import * as utils from './html/utils'
import Notification from './Notification'
import { map, groupBy } from 'lodash'
import log from 'cozy-logger'
import { getAccountBalance } from 'ducks/account/helpers'
import { getCurrencySymbol } from 'utils/currencySymbol'
import { getCurrentDate } from './html/utils'
import template from './html/templates/balance-lower.hbs'

const addCurrency = o => ({ ...o, currency: '€' })

const groupAccountsByInstitution = accounts => {
  return map(groupBy(accounts, 'institutionLabel'), (accounts, name) => ({
    name,
    accounts
  }))
}

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

  prepareHandlebars(Handlebars) {
    super.prepareHandlebars(Handlebars)
    Handlebars.registerHelper({ getAccountBalance })
  }

  fetchData() {
    const { accounts } = this.data
    const accountsFiltered = accounts
      .filter(acc => this.filter(acc))
      .map(addCurrency)
    return {
      accounts: accountsFiltered
    }
  }

  async buildTemplateData() {
    const { accounts } = await this.fetchData()
    if (accounts.length === 0) {
      log('info', 'BalanceLower: no matched accounts')
      return
    }

    log('info', `BalanceLower: ${accounts.length} accountsFiltered`)

    return {
      accounts: accounts,
      institutions: groupAccountsByInstitution(accounts),
      date: getCurrentDate(),
      ...this.urls
    }
  }

  getNotificationAttributes() {
    return {
      data: {
        route: '/balances'
      }
    }
  }

  getTitle(templateData) {
    const { accounts } = templateData
    const onlyOne = accounts.length === 1
    const firstAccount = accounts[0]

    const titleData = onlyOne
      ? {
          balance: firstAccount.balance,
          currency: '€',
          label: firstAccount.shortLabel || firstAccount.label
        }
      : {
          accountsLength: accounts.length,
          lowerBalance: this.lowerBalance,
          currency: '€'
        }

    const titleKey = `Notifications.if_balance_lower.notification.${
      onlyOne ? 'one' : 'several'
    }.title`
    return this.t(titleKey, titleData)
  }

  getPushContent(templateData) {
    const { accounts } = templateData
    const [account] = accounts
    const balance = getAccountBalance(account)

    return `${account.label} (${
      balance > 0 ? '+' : ''
    }${balance} ${getCurrencySymbol(account.currency)})`
  }
}

BalanceLower.template = template
BalanceLower.toText = toText
BalanceLower.category = 'balance-lower'
BalanceLower.preferredChannels = ['mail', 'mobile']
BalanceLower.settingKey = 'balanceLower'
BalanceLower.isValidConfig = config => Number.isFinite(config.value)

export default BalanceLower
