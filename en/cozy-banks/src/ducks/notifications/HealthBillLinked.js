import Notification from './Notification'
import { isHealthExpense } from '../categories/helpers'
import { Bill } from 'models'
import * as utils from './html/utils'
import keyBy from 'lodash/keyBy'
import log from 'cozy-logger'
import { treatedByFormat } from './html/utils'
import { getReimbursementBillIds } from './helpers'
import { prepareTransactions, getCurrentDate } from './html/utils'
import template from './html/templates/health-bill-linked.hbs'

const ACCOUNT_SEL = '.js-account'
const DATE_SEL = '.js-date'
const TRANSACTION_SEL = '.js-transaction'

const toText = cozyHTMLEmail => {
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
  return utils.toText(cozyHTMLEmail, getContent)
}

const hasReimbursements = transaction =>
  isHealthExpense(transaction) &&
  transaction.reimbursements &&
  transaction.reimbursements.length > 0

class HealthBillLinked extends Notification {
  constructor(config) {
    super(config)

    this.data = config.data
  }

  async fetchData() {
    const { accounts, transactions } = this.data
    const transactionsWithReimbursements = transactions.filter(
      hasReimbursements
    )
    const billIds = getReimbursementBillIds(transactions)
    const bills = await Bill.getAll(billIds)
    return {
      transactions: transactionsWithReimbursements,
      accounts,
      bills
    }
  }

  async buildTemplateData() {
    const { accounts, transactions, bills } = await this.fetchData()
    if (transactions.length === 0) {
      log('info', 'HealthBillLinked: no transactions with reimbursements')
      return
    }

    const accountsById = keyBy(accounts, '_id')
    const billsById = keyBy(bills, '_id')
    const transactionsByAccounts = prepareTransactions(transactions)

    return {
      accounts: accountsById,
      bills,
      transactions,
      byAccounts: transactionsByAccounts,
      billsById: billsById,
      date: getCurrentDate(),
      ...this.urls
    }
  }

  getNotificationAttributes() {
    return {
      data: {
        route: '/transactions'
      }
    }
  }

  getTitle() {
    return this.t(
      `Notifications.when_health_bill_linked.notification.content.title`
    )
  }

  getPushContent(templateData) {
    const { transactions, billsById } = templateData
    const [transaction] = transactions
    const vendors = treatedByFormat(transaction.reimbursements, billsById)

    return `${transaction.label} ${this.t(
      `Notifications.when_health_bill_linked.notification.content.treated_by`
    )} ${vendors}`
  }
}

HealthBillLinked.preferredChannels = ['mail', 'mobile']
HealthBillLinked.category = 'health-bill-linked'
HealthBillLinked.toText = toText
HealthBillLinked.template = template
HealthBillLinked.settingKey = 'healthBillLinked'

export default HealthBillLinked
