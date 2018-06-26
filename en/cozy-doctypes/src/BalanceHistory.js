const Document = require('./Document')
const BankAccount = require('./BankAccount')

class BalanceHistory extends Document {
  static async getByYearAndAccount(year, accountId) {
    const index = await Document.getIndex(this.doctype, this.idAttributes)
    const options = {
      selector: { year, 'relationships.account.data._id': accountId },
      limit: 1
    }
    const [balance] = await Document.query(index, options)

    if (balance) {
      return balance
    }

    return this.getEmptyDocument(year, accountId)
  }

  static getEmptyDocument(year, accountId) {
    return {
      year,
      balances: {},
      metadata: {
        version: this.version
      },
      relationships: {
        account: {
          data: {
            _id: accountId,
            _type: BankAccount.doctype
          }
        }
      }
    }
  }
}

BalanceHistory.doctype = 'io.cozy.bank.balancehistories'
BalanceHistory.idAttributes = ['year', 'relationships.account.data._id']
BalanceHistory.version = 1
BalanceHistory.checkedAttributes = ['balances']

module.exports = BalanceHistory
