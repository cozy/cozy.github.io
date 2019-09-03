const DOCTYPE_BANK_OPERATIONS = 'io.cozy.bank.operations'
const mkAPI = require('./api')

const findAccount = async (client, trId) => {
  const doc = await client.fetchJSON(
    'GET',
    `/data/${DOCTYPE_BANK_OPERATIONS}/${trId}?revs=true`
  )
  const revs = doc._revisions.ids
  let i = doc._revisions.start
  for (let rev of revs) {
    const doc = await client.fetchJSON(
      'GET',
      `/data/${DOCTYPE_BANK_OPERATIONS}/${trId}?revs=true&rev=${i}-${rev}`
    )
    i--
    if (doc.account) {
      return doc.account
    }
  }
}

const repairOperationsWithAccounts = async (api, client, dryRun) => {
  const operations = await api.fetchAll(DOCTYPE_BANK_OPERATIONS)
  const orphanOperations = operations.filter(x => !x.account)
  console.log('Total number of operations', operations.length)
  console.log(
    'Total number of operations without account',
    orphanOperations.length
  )
  for (let orphanOp of orphanOperations) {
    const _id = orphanOp._id
    const account = await findAccount(client, _id)
    orphanOp.account = account
  }
  if (dryRun) {
    console.log('Dry run, not updating ops')
    for (let orphanOp of orphanOperations) {
      console.log(`op: ${orphanOp._id} -> ${orphanOp.account}`)
    }
  } else {
    for (let op of orphanOperations) {
      if (op.account) {
        console.log(`Updating operation ${op._id} with account ${op.account}`)
        await client.fetchJSON(
          'PUT',
          `/data/${DOCTYPE_BANK_OPERATIONS}/${op._id}`,
          op
        )
      }
    }
  }
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_BANK_OPERATIONS]
  },

  run: async function(ach, dryRun = true) {
    try {
      const api = mkAPI(ach.client)
      await repairOperationsWithAccounts(api, ach.client, dryRun)
    } catch (err) {
      console.log(ach.url, err)
    }
  }
}
