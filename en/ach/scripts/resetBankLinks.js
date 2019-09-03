const mkAPI = require('./api')

const DOCTYPE_BILLS = 'io.cozy.bills'
const DOCTYPE_OPERATIONS = 'io.cozy.bank.operations'

let client

const resetBankLinks = operation => {
  operation.reimbursements = []
  operation.bills = []
  return operation
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_BILLS, DOCTYPE_OPERATIONS]
  },
  run: async function(ach, dryRun) {
    client = ach.client
    const api = mkAPI(client)
    const operations = await api.fetchAll(DOCTYPE_OPERATIONS)
    if (dryRun) {
      console.log(`Would update ${operations.length} operations`)
    } else {
      console.log(`Updating ${operations.length} operations...`)
      await api.updateAll(DOCTYPE_OPERATIONS, operations.map(resetBankLinks))
    }
  }
}
