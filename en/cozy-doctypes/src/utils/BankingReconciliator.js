const keyBy = require('lodash/keyBy')
const fromPairs = require('lodash/fromPairs')
const { log } = require('../log')

class BankingReconciliator {
  constructor(options) {
    this.options = options
  }

  async save(fetchedAccounts, fetchedTransactions, options) {
    const { BankAccount, BankTransaction } = this.options

    // save accounts
    const accountNumbers = new Set(
      fetchedAccounts.map(account => account[BankAccount.numberAttr])
    )
    const stackAccounts = (await BankAccount.fetchAll()).filter(acc =>
      accountNumbers.has(acc[BankAccount.numberAttr])
    )

    const matchedAccounts = BankAccount.reconciliate(
      fetchedAccounts,
      stackAccounts
    )

    log('info', 'BankingReconciliator: Saving accounts...')
    const cozyAccounts = await BankAccount.bulkSave(matchedAccounts)
    if (options.onAccountsSaved) {
      options.onAccountsSaved(cozyAccounts)
    }

    const stackTransactions = await BankTransaction.getMostRecentForAccounts(
      stackAccounts.map(x => x._id)
    )

    // attach bank accounts to transactions
    const vendorIdToCozyId = fromPairs(
      cozyAccounts.map(acc => [acc[BankAccount.vendorIdAttr], acc._id])
    )
    fetchedTransactions.forEach(tr => {
      tr.account = vendorIdToCozyId[tr[BankTransaction.vendorAccountIdAttr]]
    })

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
        isNew: transaction =>
          !stackTransactionsByVendorId[
            transaction[BankTransaction.vendorIdAttr]
          ],
        onlyMostRecent: fromNewKonnectorAccount
      }
    )
    log('info', 'BankingReconciliator: Saving transactions...')
    return BankTransaction.bulkSave(transactions)
  }
}

module.exports = BankingReconciliator
