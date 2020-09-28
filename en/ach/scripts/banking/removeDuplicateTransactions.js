const {
  matchTransactions
} = require('cozy-doctypes/src/banking/matching-transactions')
const groupBy = require('lodash/groupBy')
const merge = require('lodash/merge')
const mutations = require('./mutations')
const mkAPI = require('../api')

const DOCTYPE_OPERATIONS = 'io.cozy.bank.operations'

const getDisplayDate = x => {
  return (x['realisationDate'] || x['date']).substr(0, 10)
}

const isBudgetInsight = tr =>
  tr.metadata && tr.metadata.vendor === 'budget-insight'

const matchIntraDay = function*(transactions) {
  const byDate = groupBy(transactions, getDisplayDate)
  for (const [date, trs] of Object.entries(byDate)) {
    const linxoOps = trs.filter(tr => !isBudgetInsight(tr))
    const biOps = trs.filter(tr => isBudgetInsight(tr))
    if (biOps.length === 0 || linxoOps.length === 0) {
      continue
    }
    const matchedResults = matchTransactions(biOps, linxoOps)
    for (let r of matchedResults) {
      if (r.match) {
        console.log(
          `✅ ${date} ${r.transaction.label} matched ${r.match.label} (${
            r.transaction._id
          } -> ${r.match._id}) (${r.transaction.date.slice(
            0,
            10
          )} -> ${r.match.date.slice(0, 10)})`
        )
        yield r
      } else {
        console.log(
          '❌',
          getDisplayDate(r.transaction),
          r.transaction.label,
          'unmatched'
        )
      }
    }
  }
}

const computeMutation = async api => {
  const trs = await api.fetchAll(DOCTYPE_OPERATIONS)
  const results = Array.from(matchIntraDay(trs))

  const toDelete = []
  const toUpdate = []
  for (const result of results) {
    toDelete.push(result.transaction)
    const updatedTransaction = merge({}, result.transaction, result.match)
    toUpdate.push(updatedTransaction)
  }

  return {
    toDelete: {
      'io.cozy.bank.operations': toDelete
    },
    toUpdate: {
      'io.cozy.bank.operations': toUpdate
    }
  }
}

const run = async (api, dryRun) => {
  const mutation = await computeMutation(api)
  if (dryRun) {
    mutations.display(mutation)
  } else {
    console.log('execute')
    await mutations.execute(mutation, api)
  }
}

module.exports = {
  getDoctypes: () => [DOCTYPE_OPERATIONS],
  run: async function(ach, dryRun = true) {
    return run(mkAPI(ach.oldClient), dryRun).catch(err => {
      console.error(err)
      return {
        error: {
          message: err.message,
          stack: err.stack
        }
      }
    })
  }
}
