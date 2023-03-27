import map from 'lodash/map'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import merge from 'lodash/merge'
import { endOfMonth, subDays, isWithinRange } from 'date-fns'

import { toText } from 'cozy-notifications'
import logger from 'cozy-logger'
import { BankAccount } from 'cozy-doctypes'

import {
  getAccountBalance,
  getAccountType,
  getAccountLabel
} from 'ducks/account/helpers'
import {
  getAccountNewBalance,
  formatAmount,
  getCurrentDate,
  makeAtAttributes
} from 'ducks/notifications/helpers'
import template from './template.hbs'
import NotificationView from '../BaseNotificationView'

const getDocumentId = x => x._id

const log = logger.namespace('delayedDebit')

const groupAccountsByInstitution = accounts => {
  return map(groupBy(accounts, 'institutionLabel'), (accounts, name) => ({
    name,
    accounts
  }))
}

/**
 * Returns true if account is a credit card account
 */
export const isCreditCardAccount = account =>
  getAccountType(account) === 'CreditCard'

export const isWithinEndOfMonthRange = nbDaysBeforeEndOfMonth => {
  const today = new Date()
  const lastDayOfMonth = endOfMonth(today)
  // We need to add one to nbDaysBeforeEndOfMonth because `isWithinRange` is
  // exclusive
  const limitDate = subDays(lastDayOfMonth, nbDaysBeforeEndOfMonth + 1)

  return isWithinRange(today, limitDate, lastDayOfMonth)
}

const isBalanceGreater = (account1, account2) => {
  const balance1 = Math.abs(getAccountBalance(account1))
  const balance2 = Math.abs(getAccountBalance(account2))

  return balance1 > balance2
}

class DelayedDebit extends NotificationView {
  constructor(config) {
    super(config)
    this.rules = config.rules
    this.amountCensoring = config.amountCensoring
  }

  makeRuleMatcher(accountsById) {
    return rule => {
      if (!rule.enabled) {
        return false
      }
      const creditCardAccount = accountsById[rule.creditCardAccount._id]
      const checkingsAccount = accountsById[rule.checkingsAccount._id]
      if (!creditCardAccount || !checkingsAccount) {
        return false
      }

      const isOK =
        isBalanceGreater(creditCardAccount, checkingsAccount) &&
        isWithinEndOfMonthRange(rule.value)

      if (!isOK) {
        return false
      }

      return {
        rule,
        creditCardAccount,
        checkingsAccount
      }
    }
  }

  getHelpers() {
    return {
      ...super.getHelpers(),
      getAccountBalance,
      getAccountNewBalance
    }
  }

  async findMatchingRules() {
    const accounts = await BankAccount.fetchAll()
    const accountsById = keyBy(accounts, getDocumentId)
    const matchingRules = this.rules
      .map(this.makeRuleMatcher(accountsById))
      .filter(Boolean)

    return matchingRules
  }

  async fetchData() {
    return {
      matchingRules: await this.findMatchingRules()
    }
  }

  async buildData() {
    const data = await this.fetchData()
    if (!data) {
      return
    }
    const { matchingRules } = data

    const creditCardsToNotify = matchingRules.map(match => {
      return {
        ...match.creditCardAccount,
        checkingsAccount: {
          data: match.checkingsAccount
        }
      }
    })

    log(
      'info',
      `[🔔 notifications] DelayedDebit: ${creditCardsToNotify.length} accounts to notify`
    )
    return {
      institutions: groupAccountsByInstitution(creditCardsToNotify),
      date: getCurrentDate(),
      ...this.urls
    }
  }

  shouldSend(templateData) {
    return templateData && templateData.institutions.length > 0
  }

  getExtraAttributes() {
    return merge(super.getExtraAttributes(), {
      data: {
        route: '/balances',
        redirectLink: 'banks/#/balances'
      },
      at: makeAtAttributes('DalayedDebit')
    })
  }

  getTitle(templateData) {
    const account = templateData.institutions[0].accounts[0]
    return this.t('Notifications.delayed-debit.notification.title', {
      balance: formatAmount(
        getAccountNewBalance(account),
        this.amountCensoring
      ),
      currency: '€',
      label: getAccountLabel(account.checkingsAccount.data, this.t)
    })
  }

  getPushContent() {
    return ''
  }
}

DelayedDebit.supportsMultipleRules = true
DelayedDebit.category = 'delayed-debit'
DelayedDebit.preferredChannels = ['mobile', 'mail']
DelayedDebit.settingKey = 'delayedDebit'
DelayedDebit.isValidRule = config => Number.isFinite(config.value)
DelayedDebit.template = template
DelayedDebit.toText = html => {
  const INSTITUTION_SEL = '.js-institution'
  const ACCOUNT_SEL = '.js-account'

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
  return toText(html, getContent)
}

export default DelayedDebit
