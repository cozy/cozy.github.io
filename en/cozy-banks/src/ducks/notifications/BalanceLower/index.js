import NotificationView from 'ducks/notifications/BaseNotificationView'
import { map, groupBy } from 'lodash'
import log from 'cozy-logger'
import { getAccountBalance } from 'ducks/account/helpers'
import { getCurrencySymbol } from 'utils/currencySymbol'
import { getCurrentDate } from 'ducks/notifications/utils'
import template from './template.hbs'
import { toText } from 'cozy-notifications'

const addCurrency = o => ({ ...o, currency: '€' })

const groupAccountsByInstitution = accounts => {
  return map(groupBy(accounts, 'institutionLabel'), (accounts, name) => ({
    name,
    accounts
  }))
}

const INSTITUTION_SEL = '.js-institution'
const ACCOUNT_SEL = '.js-account'

const customToText = cozyHTMLEmail => {
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
  return toText(cozyHTMLEmail, getContent)
}

class BalanceLower extends NotificationView {
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

  getHelpers() {
    const helpers = super.getHelpers()
    return { ...helpers, getAccountBalance }
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

  async buildData() {
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

  getExtraAttributes() {
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
BalanceLower.toText = customToText
BalanceLower.category = 'balance-lower'
BalanceLower.preferredChannels = ['mobile', 'mail']
BalanceLower.settingKey = 'balanceLower'
BalanceLower.isValidConfig = config => Number.isFinite(config.value)

export default BalanceLower
