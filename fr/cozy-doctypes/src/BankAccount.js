const keyBy = require('lodash/keyBy')
const some = require('lodash/some')
const Document = require('./Document')

class BankAccount extends Document {
  static reconciliate(fetchedAccounts, localAccounts) {
    const numberAttr = BankAccount.numberAttr
    const byAccountNumber = keyBy(localAccounts, numberAttr)
    return fetchedAccounts.map(fetchedAccount => {
      const matchedSavedAccount = byAccountNumber[fetchedAccount[numberAttr]]
      return {
        ...fetchedAccount,
        _id: matchedSavedAccount && matchedSavedAccount._id
      }
    })
  }

  static isFromNewKonnector(fetchedAccounts, stackAccounts) {
    const numberAttr = this.numberAttr
    const byNumber = keyBy(stackAccounts, numberAttr)
    const byVendorId = keyBy(stackAccounts, this.vendorIdAttr)
    return some(
      fetchedAccounts,
      acc => byNumber[acc[numberAttr]] && !byVendorId[acc.id]
    )
  }
}

BankAccount.doctype = 'io.cozy.bank.accounts'
BankAccount.idAttributes = ['_id']
BankAccount.version = 1
BankAccount.checkedAttributes = null
BankAccount.numberAttr = 'number'
BankAccount.vendorIdAttr = 'vendorId'

module.exports = BankAccount
