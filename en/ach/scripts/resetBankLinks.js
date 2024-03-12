const { DOCTYPE_BANK_TRANSACTIONS, DOCTYPE_BILLS } = require('../libs/doctypes')
const mkAPI = require('./api')

let client

const resetBankLinks = operation => {
  operation.reimbursements = []
  operation.bills = []
  return operation
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_BILLS, DOCTYPE_BANK_TRANSACTIONS]
  },
  run: async function(ach, dryRun) {
    client = ach.oldClient
    const api = mkAPI(client)
    const operations = await api.fetchAll(DOCTYPE_BANK_TRANSACTIONS)
    if (dryRun) {
      console.log(`Would update ${operations.length} operations`)
    } else {
      console.log(`Updating ${operations.length} operations...`)
      await api.updateAll(
        DOCTYPE_BANK_TRANSACTIONS,
        operations.map(resetBankLinks)
      )
    }
  }
}
