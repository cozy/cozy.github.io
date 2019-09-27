import NotificationView from '../BaseNotificationView'
import logger from 'cozy-logger'
import {
  getAccountBalance,
  getAccountType,
  getAccountLabel
} from 'ducks/account/helpers'
import { endOfMonth, subDays, isWithinRange } from 'date-fns'
import { BankAccount } from 'cozy-doctypes'
import { get, keyBy, groupBy, map } from 'lodash'
import { getAccountNewBalance } from 'ducks/notifications/helpers'
import { getCurrentDate } from 'ducks/notifications/utils'
import template from './template.hbs'
import { toText } from 'cozy-notifications'

const log = logger.namespace('delayedDebit')

const groupAccountsByInstitution = accounts => {
  return map(groupBy(accounts, 'institutionLabel'), (accounts, name) => ({
    name,
    accounts
  }))
}

/**
 * Returns true if account is a credit card account linked to a checkings account
 */
export const isCreditCardAccount = account =>
  getAccountType(account) === 'CreditCard' &&
  get(account, 'relationships.checkingsAccount.data')

class DelayedDebit extends NotificationView {
  constructor(config) {
    super(config)
    log('info', `value of delayedDebit: ${config.value}`)
    this.nbDaysBeforeEndOfMonth = config.value
  }

  checkDate() {
    const today = new Date()
    const lastDayOfMonth = endOfMonth(today)
    // We need to add one to nbDaysBeforeEndOfMonth because `isWithinRange` is
    // exclusive
    const limitDate = subDays(lastDayOfMonth, this.nbDaysBeforeEndOfMonth + 1)

    return isWithinRange(today, limitDate, lastDayOfMonth)
  }

  /**
   * creditsCard should be an io.cozy.bank.accounts with relationships resolved
   */
  shouldBeNotified(creditCard) {
    const creditCardBalance = Math.abs(getAccountBalance(creditCard))
    const checkingsBalance = Math.abs(
      getAccountBalance(creditCard.checkingsAccount.data)
    )

    return creditCardBalance > checkingsBalance
  }

  /**
   * Resolve the relationships between accounts.
   * This can be removed when we use cozy-client instead of cozy-client-js
   */
  linkCreditCardsToCheckings(creditCards, allAccounts) {
    const allAccountsById = keyBy(allAccounts, a => a._id)

    creditCards.forEach(creditCard => {
      creditCard.checkingsAccount = {
        data:
          allAccountsById[creditCard.relationships.checkingsAccount.data._id]
      }
    })
  }

  getHelpers() {
    return {
      ...super.getHelpers(),
      getAccountBalance,
      getAccountNewBalance
    }
  }

  async fetchData() {
    if (!this.checkDate()) {
      return
    }

    const accounts = await BankAccount.fetchAll()
    return { accounts }
  }

  async buildData() {
    const data = await this.fetchData()
    if (!data) {
      return
    }
    const { accounts } = data
    const creditCards = accounts.filter(isCreditCardAccount)
    this.linkCreditCardsToCheckings(creditCards, accounts)

    const creditCardsToNotify = creditCards.filter(this.shouldBeNotified)
    log('info', `${creditCardsToNotify.length} accounts to notify`)

    return {
      institutions: groupAccountsByInstitution(creditCards),
      date: getCurrentDate(),
      ...this.urls
    }
  }

  shouldSend(templateData) {
    return templateData && templateData.institutions.length > 0
  }

  getExtraAttributes() {
    return {
      data: {
        route: '/balances'
      }
    }
  }

  getTitle(templateData) {
    const account = templateData.institutions[0].accounts[0]
    return this.t('Notifications.delayed_debit.notification.title', {
      balance: getAccountNewBalance(account),
      currency: '€',
      label: getAccountLabel(account.checkingsAccount.data)
    })
  }

  getPushContent() {
    return ''
  }
}

DelayedDebit.template
DelayedDebit.category = 'delayed-debit'
DelayedDebit.preferredChannels = ['mail', 'mobile']
DelayedDebit.settingKey = 'delayedDebit'
DelayedDebit.isValidConfig = config => Number.isFinite(config.value)
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
  return toText(html, getContent)
}

export default DelayedDebit
