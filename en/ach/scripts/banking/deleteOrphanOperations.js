const keyBy = require('lodash/keyBy')
const api = require('../api')
const {
  DOCTYPE_BANK_ACCOUNTS,
  DOCTYPE_BANK_TRANSACTIONS
} = require('../../libs/doctypes')

const deleteOrphanBankOperations = async dryRun => {
  const accounts = keyBy(await api.fetchAll(DOCTYPE_BANK_ACCOUNTS), 'id')
  const operations = (await api.fetchAll(
    DOCTYPE_BANK_TRANSACTIONS,
    'include_docs=true'
  ))
    .map(x => x.doc)
    .filter(x => x._id.indexOf('_design') !== 0)
  const orphanOperations = operations.filter(x => !accounts[x.account])
  console.log('Total number of operations', operations.length)
  console.log('Total number of orphan operations', orphanOperations.length)
  if (dryRun) {
    console.log('Dry run, not deleting')
  } else {
    console.log(`Deleting ${orphanOperations.length} orphan operations...`)
    if (orphanOperations.length > 0) {
      return api.deleteAll('io.cozy.bank.operations', orphanOperations)
    }
  }
}

module.exports = {
  api: api,
  getDoctypes: function() {
    return [DOCTYPE_BANK_TRANSACTIONS, DOCTYPE_BANK_ACCOUNTS]
  },

  run: async function(ach, dryRun = true) {
    try {
      await deleteOrphanBankOperations(dryRun)
    } catch (err) {
      console.log(ach.url, err)
    }
  }
}
