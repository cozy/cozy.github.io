import NotificationView from 'ducks/notifications/BaseNotificationView'
import { map, groupBy, uniqBy, flatten } from 'lodash'
import log from 'cozy-logger'
import { getAccountBalance } from 'ducks/account/helpers'
import { getCurrencySymbol } from 'utils/currencySymbol'
import { getCurrentDate } from 'ducks/notifications/utils'
import template from './template.hbs'
import { toText } from 'cozy-notifications'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'

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

const doesAccountCorrespondToAccountGroup = (
  groups,
  accountOrGroup
) => account => {
  if (!accountOrGroup) {
    return true
  } else if (accountOrGroup._type === ACCOUNT_DOCTYPE) {
    return account._id === accountOrGroup._id
  } else if (accountOrGroup._type === GROUP_DOCTYPE) {
    const group = groups.find(group => accountOrGroup._id === group._id)
    if (group && group.accounts) {
      return group.accounts.includes(account._id)
    } else {
      // In case of non existent group, prefer to consider that no accounts
      // belong to it
      return false
    }
  }
}

class BalanceLower extends NotificationView {
  constructor(config) {
    super(config)
    this.rules = config.rules
    log('info', `value of lowerBalance: ${this.rules.map(x => x.value)}`)
  }

  filterForRule(rule, account) {
    return (
      getAccountBalance(account) < rule.value &&
      account.type !== 'CreditCard' && // CreditCard are always in negative balance
      doesAccountCorrespondToAccountGroup(
        this.data.groups,
        rule.accountOrGroup
      )(account)
    )
  }

  /**
   * Returns a list of [{ rule, accounts }]
   * For each rule, returns a list of accounts
   * Rules that do not match any accounts are discarded
   */
  findMatchingRules() {
    return this.rules
      .map(rule => ({
        rule,
        accounts: this.data.accounts.filter(acc =>
          this.filterForRule(rule, acc)
        )
      }))
      .filter(({ accounts }) => accounts.length > 0)
  }

  fetchData() {
    const matchingRules = this.findMatchingRules()
    const accountsFiltered = uniqBy(
      flatten(matchingRules.map(x => x.accounts)),
      x => x._id
    ).map(addCurrency)
    return {
      matchingRules,
      accounts: accountsFiltered
    }
  }

  getHelpers() {
    const helpers = super.getHelpers()
    return { ...helpers, getAccountBalance }
  }

  async buildData() {
    const { accounts, matchingRules } = await this.fetchData()
    if (accounts.length === 0) {
      log('info', 'BalanceLower: no matched accounts')
      return
    }

    log('info', `BalanceLower: ${accounts.length} accountsFiltered`)

    return {
      matchingRules,
      accounts,
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
    const { accounts, matchingRules } = templateData
    const onlyOne = accounts.length === 1
    const firstAccount = accounts[0]

    const titleKey = onlyOne
      ? 'Notifications.if_balance_lower.notification.one.title'
      : matchingRules.length === 1
      ? 'Notifications.if_balance_lower.notification.several.title'
      : 'Notifications.if_balance_lower.notification.several-multi-rule.title'

    const firstRule = this.rules[0].value
    const titleData = onlyOne
      ? {
          balance: firstAccount.balance,
          currency: '€',
          label: firstAccount.shortLabel || firstAccount.label
        }
      : {
          accountsLength: accounts.length,
          lowerBalance: firstRule,
          currency: '€'
        }
    return this.t(titleKey, titleData)
  }

  getPushContent(templateData) {
    const { accounts } = templateData

    return accounts
      .map(account => {
        const balance = getAccountBalance(account)
        return `${account.label} ${
          balance > 0 ? '+' : ''
        }${balance}${getCurrencySymbol(account.currency)}`
      })
      .join(', ')
  }
}

BalanceLower.template = template
BalanceLower.toText = customToText
BalanceLower.category = 'balance-lower'
BalanceLower.preferredChannels = ['mobile', 'mail']
BalanceLower.settingKey = 'balanceLower'
BalanceLower.isValidRule = config => Number.isFinite(config.value)

export default BalanceLower
