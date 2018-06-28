const keyBy = require('lodash/keyBy')
const fromPairs = require('lodash/fromPairs')
const log = require('cozy-logger').namespace('BankingReconciliator')

class BankingReconciliator {
  constructor(options) {
    this.options = options
  }

  async save(fetchedAccounts, fetchedTransactions, options = {}) {
    const { BankAccount, BankTransaction } = this.options

    // Fetch stack accounts corresponding (via numberAttr) to the bank
    // accounts fetched by the konnector
    const accountNumbers = new Set(
      fetchedAccounts.map(account => account[BankAccount.numberAttr])
    )
    const stackAccounts = (await BankAccount.fetchAll()).filter(acc =>
      accountNumbers.has(acc[BankAccount.numberAttr])
    )

    // Reconciliate
    const matchedAccounts = BankAccount.reconciliate(
      fetchedAccounts,
      stackAccounts
    )

    log('info', 'Saving accounts...')
    const savedAccounts = await BankAccount.bulkSave(matchedAccounts)
    if (options.onAccountsSaved) {
      options.onAccountsSaved(savedAccounts)
    }

    // Bank accounts saved in Cozy, we can now link transactions to accounts
    // via their cozy id
    const vendorIdToCozyId = fromPairs(
      savedAccounts.map(acc => [acc[BankAccount.vendorIdAttr], acc._id])
    )
    log('info', vendorIdToCozyId, 'Linking transactions to accounts...')

    fetchedTransactions.forEach(tr => {
      tr.account = vendorIdToCozyId[tr[BankTransaction.vendorAccountIdAttr]]
      if (tr.account === undefined) {
        log(
          'warn',
          `Transaction without account, vendorAccountIdAttr: ${
            BankTransaction.vendorAccountIdAttr
          }`
        )
        log('warn', 'transaction: ' + JSON.stringify(tr))
        throw new Error('Transaction without account.')
      }
    })

    const stackTransactions = await BankTransaction.getMostRecentForAccounts(
      stackAccounts.map(x => x._id)
    )

    const stackTransactionsByVendorId = keyBy(
      stackTransactions,
      BankTransaction.vendorIdAttr
    )
    const fromNewKonnectorAccount = BankAccount.isFromNewKonnector(
      fetchedAccounts,
      stackAccounts
    )
    const transactions = BankTransaction.reconciliate(
      fetchedTransactions,
      stackTransactions,
      {
        isNew: transaction => {
          let vendorId = transaction[BankTransaction.vendorIdAttr]
          return !vendorId || !stackTransactionsByVendorId[vendorId]
        },
        onlyMostRecent: fromNewKonnectorAccount
      }
    )

    log('info', 'Saving transactions...')
    const savedTransactions = await BankTransaction.bulkSave(transactions)
    return {
      accounts: savedAccounts,
      transactions: savedTransactions
    }
  }
}

module.exports = BankingReconciliator
