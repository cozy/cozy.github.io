import { subDays } from 'date-fns'
import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import overEvery from 'lodash/overEvery'
import merge from 'lodash/merge'
import groupBy from 'lodash/groupBy'
import fromPairs from 'lodash/fromPairs'

import log from 'cozy-logger'

import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import NotificationView from 'ducks/notifications/BaseNotificationView'
import {
  getDate,
  isNew as isNewTransaction,
  isAlreadyNotified,
  setAlreadyNotified
} from 'ducks/transactions/helpers'
import { getCurrencySymbol } from 'utils/currencySymbol'
import {
  prepareTransactions,
  getCurrentDate,
  formatAmount,
  isTransactionAmountGreaterThan,
  makeAtAttributes
} from 'ducks/notifications/helpers'
import template from 'ducks/notifications/TransactionGreater/template.hbs'
import {
  customToText,
  formatTransaction
} from 'ducks/notifications/TransactionGreater/utils'

const getDocumentId = x => x._id

const SINGLE_TRANSACTION = 'single'
const MULTI_TRANSACTION = 'multi'
const MULTI_TRANSACTION_MULTI_RULES = 'multi-rules'

/**
 * @typedef {object} Rule
 */

/**
 * @typedef {object} RuleResult
 * @property {Rule} rule - The rule being matched
 * @property {Array<Transaction>} transactions - Transactions that matched the rule
 *
 */

// During tests, it is difficult to keep transactions with
// first _rev since we replace replace existing transactions, this
// is why we deactivate the isNewTransaction during tests
const isNewTransactionOutsideTests =
  process.env.IS_TESTING === 'test' ? () => true : isNewTransaction

const isTransactionFromAccount = account => transaction =>
  transaction.account === account._id

const isTransactionFromGroup = group => transaction =>
  group.accounts.includes(transaction.account)

const makeAccountOrGroupFilter = (groups, accountOrGroup) => {
  const noFilter = () => true
  if (!accountOrGroup) {
    return noFilter
  } else if (accountOrGroup._type === ACCOUNT_DOCTYPE) {
    return isTransactionFromAccount(accountOrGroup)
  } else if (accountOrGroup._type === GROUP_DOCTYPE) {
    const group = groups.find(group => group._id === accountOrGroup._id)
    if (!group || !group.accounts) {
      return noFilter
    } else {
      return isTransactionFromGroup(group)
    }
  }
}

/**
 * Sends a notification when a transaction amount is greater than
 * a threshold.
 */
class TransactionGreater extends NotificationView {
  constructor(config) {
    super(config)
    this.rules = config.rules
    this.amountCensoring = config.amountCensoring
  }

  /**
   * Creates a filtering function from a rule
   *
   * @param  {Rule} rule - A rule
   * @return {function(Transaction): Boolean} - Predicates that check if a transaction matches rule
   */
  filterForRule(rule) {
    const fourDaysAgo = subDays(new Date(), 4)

    const isRecentEnough = transaction =>
      new Date(getDate(transaction)) > fourDaysAgo
    const isGreatEnough = isTransactionAmountGreaterThan(rule.value)
    const correspondsToAccountGroup = makeAccountOrGroupFilter(
      this.data.groups,
      rule.accountOrGroup
    )

    return overEvery(
      isNewTransactionOutsideTests,
      isRecentEnough,
      isGreatEnough,
      correspondsToAccountGroup
    )
  }

  /**
   * For each rule, returns a list of matching transactions
   * Rules that do not match any transactions are discarded
   *
   * @return {Array<RuleResult>}
   */
  findMatchingRules() {
    return this.rules
      .filter(rule => rule.enabled)
      .map(rule => ({
        rule,
        transactions: this.data.transactions.filter(this.filterForRule(rule))
      }))
      .filter(({ transactions }) => transactions.length > 0)
  }

  async fetchData() {
    const { accounts } = this.data
    const matchingRules = this.findMatchingRules()
    const transactionsFiltered = uniqBy(
      flatten(matchingRules.map(result => result.transactions)),
      getDocumentId
    ).filter(transaction => !isAlreadyNotified(transaction, TransactionGreater))
    return {
      matchingRules,
      accounts,
      transactions: transactionsFiltered
    }
  }

  async buildData() {
    const { accounts, transactions, matchingRules } = await this.fetchData()

    if (transactions.length === 0) {
      log(
        'info',
        '[🔔 notifications] TransactionGreater: no matched transactions'
      )
      return
    }

    this.toNotify = transactions

    const accountsById = fromPairs(
      accounts.map(account => [account._id, account])
    )
    const transactionsByAccounts = prepareTransactions(transactions)

    return {
      accounts: accountsById,
      transactions,
      matchingRules,
      byAccounts: transactionsByAccounts,
      date: getCurrentDate(),
      ...this.urls
    }
  }

  getExtraAttributes() {
    const attributes = super.getExtraAttributes()
    const accountIds = Object.keys(groupBy(this.toNotify, x => x.account))

    const route =
      accountIds.length == 1
        ? `/balances/${accountIds[0]}/details`
        : `/balances/details`

    return merge(attributes, {
      data: {
        route,
        redirectLink: `banks/#${route}`
      },
      at: makeAtAttributes('TransactionGreater')
    })
  }

  getNotificationSubtype(templateData) {
    const { transactions, matchingRules } = templateData
    if (transactions.length === 1) {
      return SINGLE_TRANSACTION
    } else if (transactions.length > 1 && matchingRules.length === 1) {
      return MULTI_TRANSACTION
    } else {
      return MULTI_TRANSACTION_MULTI_RULES
    }
  }

  /**
   * @return {string} - The title of the notification
   */
  getTitle(templateData) {
    const { transactions, matchingRules } = templateData
    const onlyOne = transactions.length === 1
    const firstTransaction = transactions[0]

    const notificationSubtype = this.getNotificationSubtype(templateData)
    const titleData =
      notificationSubtype === SINGLE_TRANSACTION
        ? {
            firstTransaction: firstTransaction,
            amount: formatAmount(
              Math.abs(firstTransaction.amount),
              this.amountCensoring
            ),
            currency: getCurrencySymbol(firstTransaction.currency)
          }
        : notificationSubtype === MULTI_TRANSACTION
        ? {
            transactionsLength: transactions.length,
            maxAmount: formatAmount(
              matchingRules[0].rule.value,
              this.amountCensoring
            )
          }
        : {
            transactionsLength: transactions.length,
            matchingRulesLength: matchingRules.length
          }

    const titleKey = onlyOne
      ? firstTransaction.amount > 0
        ? `Notifications.if-transaction-greater.notification.credit.title`
        : `Notifications.if-transaction-greater.notification.debit.title`
      : matchingRules.length === 1
      ? `Notifications.if-transaction-greater.notification.others.title`
      : `Notifications.if-transaction-greater.notification.others-multi.title`
    return this.t(titleKey, titleData)
  }

  getPushContent(templateData) {
    const { transactions } = templateData

    const pushContent =
      transactions.length > 3
        ? transactions
            .slice(0, 3)
            .map(transaction =>
              formatTransaction(transaction, this.amountCensoring)
            )
            .join('\n')
            .concat('...')
        : transactions
            .map(transaction =>
              formatTransaction(transaction, this.amountCensoring)
            )
            .join('\n')

    return pushContent
  }

  /**
   * Saves last notification date to transactions for which there was
   * the notification.
   *
   * Executed by `Notification` when the notification has been successfully sent
   * See `Notification::sendNotification`
   */
  async onSuccess() {
    this.toNotify.forEach(transaction => {
      setAlreadyNotified(transaction, TransactionGreater)
    })
    await this.client.saveAll(this.toNotify)
  }
}

TransactionGreater.supportsMultipleRules = true
TransactionGreater.category = 'transaction-greater'
TransactionGreater.toText = customToText
TransactionGreater.preferredChannels = ['mobile', 'mail']
TransactionGreater.template = template
TransactionGreater.settingKey = 'transactionGreater'
TransactionGreater.isValidRule = config => Number.isFinite(config.value)

export default TransactionGreater
