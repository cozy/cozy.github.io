import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import merge from 'lodash/merge'

import log from 'cozy-logger'
import { toText } from 'cozy-notifications'

import NotificationView from 'ducks/notifications/BaseNotificationView'
import { getAccountBalance } from 'ducks/account/helpers'
import { getCurrencySymbol } from 'utils/currencySymbol'
import {
  getCurrentDate,
  formatAmount,
  formatAmountWithSign,
  makeAtAttributes
} from 'ducks/notifications/helpers'
import { ruleAccountFilter } from 'ducks/settings/ruleUtils'

import template from './template.hbs'
import { fetchSettings } from 'ducks/settings/helpers'

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
                $(td).text().replace(/\n/g, '').replace(' €', '€').trim()
              )
              .toArray()
              .join(' ')
          )
        }
      })
      .join('\n')
  return toText(cozyHTMLEmail, getContent)
}

class BalanceGreater extends NotificationView {
  constructor(config) {
    super(config)
    this.rules = config.rules
    this.amountCensoring = config.amountCensoring
    log(
      'info',
      `[🔔 notifications] value of BalanceGreater: ${this.rules.map(
        x => x.value
      )}`
    )
  }

  filterForRule(rule, account, balancesNotifications) {
    const lastAccountBalance =
      balancesNotifications[account._id] != null
        ? balancesNotifications[account._id]
        : null
    const isLastBalanceOver =
      lastAccountBalance !== null ? lastAccountBalance <= rule.value : true
    const isBalanceOver =
      isLastBalanceOver && getAccountBalance(account) > rule.value
    const accountFilter = ruleAccountFilter(rule, this.data.groups)
    const correspondsAccountToGroup = accountFilter(account)
    return isBalanceOver && correspondsAccountToGroup
  }

  /**
   * Returns a list of [{ rule, accounts }]
   * For each rule, returns a list of matching accounts
   * Rules that do not match any accounts are discarded
   */
  findMatchingRules(balancesNotifications) {
    return this.rules
      .filter(rule => rule.enabled)
      .map(rule => ({
        rule,
        accounts: this.data.accounts.filter(acc =>
          this.filterForRule(rule, acc, balancesNotifications)
        )
      }))
      .filter(({ accounts }) => accounts.length > 0)
  }

  async fetchData() {
    const { balancesNotifications } = await fetchSettings(this.client)

    const matchingRules = this.findMatchingRules(balancesNotifications)
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
      log('info', '[🔔 notifications] BalanceGreater: no matched accounts')
      return
    }

    log(
      'info',
      `[🔔 notifications] BalanceGreater: ${accounts.length} matching account(s)`
    )

    accounts.forEach(account =>
      log(
        'info',
        `[🔔 notifications] BalanceGreater: account id: ${account._id}, label: ${account.label}, balance: ${account.balance}`
      )
    )

    return {
      matchingRules,
      accounts,
      institutions: groupAccountsByInstitution(accounts),
      date: getCurrentDate(),
      ...this.urls
    }
  }

  getExtraAttributes() {
    return merge(super.getExtraAttributes(), {
      data: {
        route: '/balances',
        redirectLink: 'banks/#/balances'
      },
      at: makeAtAttributes('BalanceGreater')
    })
  }

  getTitle(templateData) {
    const { accounts, matchingRules } = templateData
    const onlyOne = accounts.length === 1
    const firstAccount = accounts[0]

    const titleKey = onlyOne
      ? 'Notifications.if-balance-greater.notification.one.title'
      : matchingRules.length === 1
      ? 'Notifications.if-balance-greater.notification.several.title'
      : 'Notifications.if-balance-greater.notification.several-multi-rule.title'

    const firstRule = matchingRules[0].rule
    const titleData = onlyOne
      ? {
          balance: formatAmount(firstAccount.balance, this.amountCensoring),
          currency: '€',
          label: firstAccount.shortLabel || firstAccount.label
        }
      : {
          accountsLength: accounts.length,
          greaterBalance: formatAmount(firstRule.value, this.amountCensoring),
          currency: '€'
        }
    return this.t(titleKey, titleData)
  }

  getPushContent(templateData) {
    const { accounts } = templateData

    return accounts
      .map(account => {
        const balance = getAccountBalance(account)
        return `${account.label} ${formatAmountWithSign(
          balance,
          this.amountCensoring
        )}${getCurrencySymbol(account.currency)}`
      })
      .join('\n')
  }
}

BalanceGreater.supportsMultipleRules = true
BalanceGreater.template = template
BalanceGreater.toText = customToText
BalanceGreater.category = 'balance-greater'
BalanceGreater.preferredChannels = ['mobile', 'mail']
BalanceGreater.settingKey = 'balanceGreater'
BalanceGreater.isValidRule = config => Number.isFinite(config.value)

export default BalanceGreater
