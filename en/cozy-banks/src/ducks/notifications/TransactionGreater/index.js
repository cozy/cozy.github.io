import { subDays } from 'date-fns'
import NotificationView from 'ducks/notifications/BaseNotificationView'
import { sortBy, fromPairs } from 'lodash'
import log from 'cozy-logger'
import { getDate, isNew as isNewTransaction } from 'ducks/transactions/helpers'
import { isTransactionAmountGreaterThan } from 'ducks/notifications/helpers'
import { getCurrencySymbol } from 'utils/currencySymbol'
import template from './template.hbs'
import { prepareTransactions, getCurrentDate } from 'ducks/notifications/utils'
import { toText } from 'cozy-notifications'
import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import overEvery from 'lodash/overEvery'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'

const getDocumentId = x => x._id

const ACCOUNT_SEL = '.js-account'
const DATE_SEL = '.js-date'
const TRANSACTION_SEL = '.js-transaction'

// During tests, it is difficult to keep transactions with
// first _rev since we replace replace existing transactions, this
// is why we deactivate the isNewTransaction during tests
const isNewTransactionOutsideTests =
  process.env.IS_TESTING === 'test' ? () => true : isNewTransaction

const customToText = cozyHTMLEmail => {
  const getTextTransactionRow = $row =>
    $row
      .find('td')
      .map((i, td) =>
        $row
          .find(td)
          .text()
          .trim()
      )
      .toArray()
      .join(' ')
      .replace(/\n/g, '')
      .replace(' €', '€')
      .trim()

  const getContent = $ =>
    $([ACCOUNT_SEL, DATE_SEL, TRANSACTION_SEL].join(', '))
      .toArray()
      .map(node => {
        const $node = $(node)
        if ($node.is(ACCOUNT_SEL)) {
          return '\n\n### ' + $node.text()
        } else if ($node.is(DATE_SEL)) {
          return '\n' + $node.text() + '\n'
        } else if ($node.is(TRANSACTION_SEL)) {
          return '- ' + getTextTransactionRow($node)
        }
      })
      .join('\n')
  return toText(cozyHTMLEmail, getContent)
}

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

class TransactionGreater extends NotificationView {
  constructor(config) {
    super(config)
    this.rules = config.rules
  }

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
   * Returns a list of [{ rule, transactions }]
   * For each rule, returns a list of matching transactions
   * Rules that do not match any transactions are discarded
   */
  findMatchingRules() {
    return this.rules
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
      flatten(matchingRules.map(x => x.transactions)),
      getDocumentId
    )
    return {
      matchingRules,
      accounts,
      transactions: transactionsFiltered
    }
  }

  async buildData() {
    const { accounts, transactions, matchingRules } = await this.fetchData()
    if (transactions.length === 0) {
      log('info', 'TransactionGreater: no matched transactions')
      return
    }

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
    return {
      data: {
        route: '/transactions'
      }
    }
  }

  getTitle(templateData) {
    const { transactions, matchingRules } = templateData
    const onlyOne = transactions.length === 1
    const firstTransaction = transactions[0]
    const titleData = onlyOne
      ? {
          firstTransaction: firstTransaction,
          amount: firstTransaction.amount,
          currency: getCurrencySymbol(firstTransaction.currency)
        }
      : matchingRules.length === 1
      ? {
          transactionsLength: transactions.length,
          maxAmount: matchingRules[0].rule.value
        }
      : {
          transactionsLength: transactions.length
        }

    const titleKey = onlyOne
      ? firstTransaction.amount > 0
        ? `Notifications.if_transaction_greater.notification.credit.title`
        : `Notifications.if_transaction_greater.notification.debit.title`
      : matchingRules.length === 1
      ? `Notifications.if_transaction_greater.notification.others.title`
      : `Notifications.if_transaction_greater.notification.others-multi.title`
    return this.t(titleKey, titleData)
  }

  getPushContent(templateData) {
    const transactions = templateData.transactions
    const [transaction] = sortBy(transactions, getDate).reverse()

    return `${transaction.label} : ${transaction.amount} ${getCurrencySymbol(
      transaction.currency
    )}`
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
