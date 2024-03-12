const { DOCTYPE_BANK_ACCOUNTS } = require('../../libs/doctypes')
const mkAPI = require('../api')
const groupBy = require('lodash/groupBy')

const run = async (client, api) => {
  const accounts = await api.fetchAll(DOCTYPE_BANK_ACCOUNTS)
  const duplicates = Object.entries(groupBy(accounts, x => x.label)).filter(
    ([, group]) => group.length > 1
  )
  const info = {
    duplicates
  }
  return info
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_BANK_ACCOUNTS]
  },

  run: async function(ach, dryRun = true) {
    return run(ach.oldClient, mkAPI(ach.oldClient), dryRun).catch(err => {
      return {
        error: {
          message: err.message,
          stack: err.stack
        }
      }
    })
  }
}
