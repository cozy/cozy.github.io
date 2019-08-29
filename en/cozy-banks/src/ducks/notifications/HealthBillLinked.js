import Handlebars from 'handlebars'
import Notification from './Notification'
import { isHealthExpense } from '../categories/helpers'
import htmlTemplate from './html/health-bill-linked-html'
import { Bill } from 'models'
import * as utils from './html/utils'
import keyBy from 'lodash/keyBy'
import log from 'cozy-logger'
import { treatedByFormat } from './html/utils'
import { getReimbursementBillIds } from './helpers'

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

class HealthBillLinked extends Notification {
  constructor(config) {
    super(config)

    this.data = config.data
  }

  filterTransactions(transactions) {
    return transactions.filter(
      transaction =>
        isHealthExpense(transaction) &&
        transaction.reimbursements &&
        transaction.reimbursements.length > 0
    )
  }

  buildNotification({ accounts, transactions }) {
    const transactionsWithReimbursements = this.filterTransactions(transactions)

    if (transactionsWithReimbursements.length === 0) {
      log('info', 'HealthBillLinked: no transactions with reimbursements')
      return
    }

    Handlebars.registerHelper({ t: this.t })

    const billIds = getReimbursementBillIds(transactionsWithReimbursements)

    return Bill.getAll(billIds).then(bills => {
      const templateData = {
        accounts: accounts,
        transactions: transactionsWithReimbursements,
        bills: bills,
        urls: this.urls
      }

      const contentHTML = htmlTemplate(templateData)

      return {
        category: 'health-bill-linked',
        title: this.t(
          `Notifications.when_health_bill_linked.notification.content.title`
        ),
        message: this.getPushContent(transactionsWithReimbursements, bills),
        preferred_channels: ['mail', 'mobile'],
        content: toText(contentHTML),
        content_html: contentHTML,
        data: {
          route: '/transactions'
        }
      }
    })
  }

  getPushContent(transactions, bills) {
    const [transaction] = transactions
    const billsById = keyBy(bills, x => x._id)
    const vendors = treatedByFormat(transaction.reimbursements, billsById)

    return `${transaction.label} ${this.t(
      `Notifications.when_health_bill_linked.notification.content.treated_by`
    )} ${vendors}`
  }
}

HealthBillLinked.settingKey = 'healthBillLinked'

export default HealthBillLinked
