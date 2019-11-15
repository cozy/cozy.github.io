import { subDays } from 'date-fns'
import NotificationView from 'ducks/notifications/BaseNotificationView'
import { sortBy, fromPairs } from 'lodash'
import log from 'cozy-logger'
import {
  getDate,
  isNew as isNewTransaction,
  isTransactionAmountGreaterThan
} from 'ducks/transactions/helpers'
import { getCurrencySymbol } from 'utils/currencySymbol'
import template from './template.hbs'
import { prepareTransactions, getCurrentDate } from 'ducks/notifications/utils'
import { toText } from 'cozy-notifications'

const ACCOUNT_SEL = '.js-account'
const DATE_SEL = '.js-date'
const TRANSACTION_SEL = '.js-transaction'

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

class TransactionGreater extends NotificationView {
  constructor(config) {
    super(config)

    this.maxAmount = config.value
  }

  filterTransactions(transactions) {
    const fourDaysAgo = subDays(new Date(), 4)

    return transactions
      .filter(isNewTransaction)
      .filter(tr => new Date(getDate(tr)) > fourDaysAgo)
      .filter(isTransactionAmountGreaterThan(this.maxAmount))
  }

  async fetchData() {
    const { accounts, transactions } = this.data
    const transactionsFiltered = this.filterTransactions(transactions)
    return {
      accounts,
      transactions: transactionsFiltered
    }
  }

  async buildData() {
    const { accounts, transactions } = await this.fetchData()
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
      transactions: transactions,
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
    const { transactions } = templateData
    const onlyOne = transactions.length === 1
    const firstTransaction = transactions[0]
    const titleData = onlyOne
      ? {
          firstTransaction: firstTransaction,
          amount: firstTransaction.amount,
          currency: getCurrencySymbol(firstTransaction.currency)
        }
      : {
          transactionsLength: transactions.length,
          maxAmount: this.maxAmount
        }

    const translateKey = 'Notifications.if_transaction_greater.notification'
    const titleKey = onlyOne
      ? firstTransaction.amount > 0
        ? `${translateKey}.credit.title`
        : `${translateKey}.debit.title`
      : `${translateKey}.others.title`
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

TransactionGreater.category = 'transaction-greater'
TransactionGreater.toText = customToText
TransactionGreater.preferredChannels = ['mobile', 'mail']
TransactionGreater.template = template
TransactionGreater.settingKey = 'transactionGreater'
TransactionGreater.isValidConfig = config => Number.isFinite(config.value)

export default TransactionGreater
