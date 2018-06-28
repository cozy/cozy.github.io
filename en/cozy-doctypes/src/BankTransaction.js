const keyBy = require('lodash/keyBy')
const groupBy = require('lodash/groupBy')
const max = require('lodash/max')
const Document = require('./Document')
const BankAccount = require('./BankAccount')
const log = require('./log')

const getDate = transaction => transaction.date.slice(0, 10)

const getSplitDate = (linxoTransactions, stackTransactions) => {
  // Find the first date for which we have new linxo transactions
  // We'll delete transactions after this date and add new ones
  return max(stackTransactions.map(transaction => getDate(transaction)))
}

const ensureISOString = date => {
  if (date instanceof Date) {
    return date.toISOString()
  } else {
    return date
  }
}

class Transaction extends Document {
  static getDate(transaction) {
    return transaction
  }

  isAfter(minDate) {
    if (!minDate) {
      return true
    } else {
      const day = ensureISOString(this.date).slice(0, 10)
      if (day !== 'NaN') {
        return day > minDate
      } else {
        log(
          'warn',
          'transaction date could not be parsed. transaction: ' +
            JSON.stringify(this)
        )
        return false
      }
    }
  }

  static reconciliate(remoteTransactions, localTransactions, options) {
    const groups = groupBy(
      remoteTransactions,
      tr => (options.isNew(tr) ? 'newTransactions' : 'updatedTransactions')
    )
    let newTransactions = groups.newTransactions || []
    const updatedTransactions = groups.updatedTransactions || []

    log('info', 'Saving data from a new Linxo account')
    // If saving from a new linxo account, transactions will not have the same linxo ids as the ones in the
    // database, we have to filter all transactions that are before our last save transactions
    const splitDate = getSplitDate(remoteTransactions, localTransactions)
    const onlyMostRecent = options.onlyMostRecent
    if (onlyMostRecent && splitDate) {
      log('info', `Not saving new transactions before: ${splitDate}`)
      const isAfterSplit = x => Transaction.prototype.isAfter.call(x, splitDate)
      newTransactions = newTransactions.filter(isAfterSplit)
      log('info', `After split ${newTransactions.length}`)
    } else {
      log(
        'info',
        `onlyMostRecent: ${onlyMostRecent}, splitDate: ${splitDate}, saving all new transactions`
      )
    }

    log(
      'info',
      `Transaction reconciliation: new ${newTransactions.length}, updated ${
        updatedTransactions.length
      }, split date ${splitDate} `
    )
    return [].concat(newTransactions).concat(updatedTransactions)
  }

  static async getMostRecentForAccounts(accountIds) {
    try {
      log('debug', 'Transaction.getLast')

      const index = await Document.getIndex(this.doctype, ['date', 'account'])
      const options = {
        selector: {
          date: { $gte: null },
          account: {
            $in: accountIds
          }
        },
        sort: [{ date: 'desc' }]
      }
      const transactions = await Document.query(index, options)
      log('info', transactions.length, 'last transactions length')

      return transactions
    } catch (e) {
      log('error', e)

      return []
    }
  }

  static async deleteOrphans() {
    log('info', 'Deleting up orphan operations')
    const accounts = keyBy(await BankAccount.fetchAll(), '_id')
    const operations = await this.fetchAll()
    const orphanOperations = operations.filter(x => !accounts[x.account])
    log('info', `Total number of operations: ${operations.length}`)
    log('info', `Total number of orphan operations: ${orphanOperations.length}`)
    log('info', `Deleting ${orphanOperations.length} orphan operations...`)
    if (orphanOperations.length > 0) {
      return this.deleteAll(orphanOperations)
    }
  }

  getVendorAccountId() {
    return this[this.constructor.vendorAccountIdAttr]
  }
}
Transaction.doctype = 'io.cozy.bank.operations'
Transaction.version = 1
Transaction.vendorAccountIdAttr = 'vendorAccountId'
Transaction.vendorIdAttr = 'vendorId'
Transaction.idAttributes = ['vendorId']
Transaction.checkedAttributes = [
  'label',
  'originalBankLabel',
  'automaticCategoryId'
]

module.exports = Transaction
