import Handlebars from 'handlebars'
import htmlTemplate from './html/delayed-debit-html'
import * as utils from './html/utils'
import Notification from './Notification'
import logger from 'cozy-logger'
import {
  getAccountBalance,
  getAccountType,
  getAccountLabel
} from 'ducks/account/helpers'
import { endOfMonth, subDays, isWithinRange } from 'date-fns'
import { BankAccount } from 'cozy-doctypes'
import { get, keyBy } from 'lodash'
import { getAccountNewBalance } from './helpers'

const log = logger.namespace('delayedDebit')

class DelayedDebit extends Notification {
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
   * Filters the CreditCard accounts that have a relationship with a Checkings
   * accounts out of an array of accounts
   */
  filterCreditCardAccounts(accounts) {
    return accounts.filter(
      account =>
        getAccountType(account) === 'CreditCard' &&
        get(account, 'relationships.checkingsAccount.data')
    )
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

  async buildNotification() {
    if (!this.checkDate()) {
      return
    }

    const accounts = await BankAccount.fetchAll()
    const creditCards = this.filterCreditCardAccounts(accounts)
    this.linkCreditCardsToCheckings(creditCards, accounts)

    const creditCardsToNotify = creditCards.filter(this.shouldBeNotified)
    log('info', `${creditCardsToNotify.length} accounts to notify`)

    if (creditCardsToNotify.length === 0) {
      return
    }

    const mailContent = this.getMailContent(creditCardsToNotify)
    const pushContent = this.getPushContent(creditCardsToNotify)

    const title = this.t('Notifications.delayed_debit.notification.title', {
      balance: getAccountNewBalance(creditCardsToNotify[0]),
      currency: '€',
      label: getAccountLabel(creditCardsToNotify[0].checkingsAccount.data)
    })

    return {
      category: 'delayed-debit',
      title,
      message: pushContent,
      preferred_channels: ['mail', 'mobile'],
      content: mailContent.text,
      content_html: mailContent.html,
      data: {
        route: '/balances'
      }
    }
  }

  getPushContent() {
    return ''
  }

  htmlToText(html) {
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
    return utils.toText(html, getContent)
  }

  getMailContent(creditCards) {
    Handlebars.registerHelper({ t: this.t })
    Handlebars.registerHelper({ getAccountBalance })
    Handlebars.registerHelper({ getAccountNewBalance })

    const templateData = {
      accounts: creditCards,
      urls: this.urls
    }

    const htmlContent = htmlTemplate(templateData)
    const textContent = this.htmlToText(htmlContent)

    return {
      text: textContent,
      html: htmlContent
    }
  }
}

DelayedDebit.settingKey = 'delayedDebit'
DelayedDebit.isValidConfig = config => Number.isFinite(config.value)

export default DelayedDebit
