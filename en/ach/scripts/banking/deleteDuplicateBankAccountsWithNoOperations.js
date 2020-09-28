const mkAPI = require('../api')
const groupBy = require('lodash/groupBy')
const flatten = require('lodash/flatten')
const log = require('../../libs/log')

const DOCTYPE_BANK_ACCOUNTS = 'io.cozy.bank.accounts'
const DOCTYPE_BANK_TRANSACTIONS = 'io.cozy.bank.operations'

const findDuplicateAccounts = accounts => {
  const duplicateAccountGroups = flatten(
    Object.entries(groupBy(accounts, x => x.institutionLabel + ' > ' + x.label))
      .map(([, group]) => group)
      .filter(group => group.length > 1)
  )

  return duplicateAccountGroups
}

/** Returns a functions that filters out accounts with operations */
const hasNoOperations = operations => {
  const opsByAccountId = groupBy(operations, op => op.account)
  return account => {
    const accountOperations = opsByAccountId[account._id] || []
    log.info(
      `Account ${account._id} has ${accountOperations.length} operations`
    )
    return accountOperations.length === 0
  }
}

const run = async (api, dryRun) => {
  const accounts = await api.fetchAll(DOCTYPE_BANK_ACCOUNTS)
  const operations = await api.fetchAll(DOCTYPE_BANK_TRANSACTIONS)
  const duplicateGroups = findDuplicateAccounts(accounts)
  const withoutOps = hasNoOperations(operations)
  const accountsToDelete = flatten(
    duplicateGroups
      .map(accounts => accounts.filter(withoutOps).slice(1))
      .filter(Boolean)
  )

  const info = {
    nDuplicateGroups: duplicateGroups.length,
    deletedAccounts: accountsToDelete.map(x => ({
      label: x.label,
      _id: x._id
    }))
  }
  try {
    if (dryRun) {
      info.dryRun = true
    } else {
      if (accountsToDelete.length > 0) {
        await api.deleteAll(DOCTYPE_BANK_ACCOUNTS, accountsToDelete)
      }
      info.success = true
    }
  } catch (e) {
    info.error = {
      message: e.message,
      stack: e.stack
    }
  }
  return info
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_BANK_ACCOUNTS, DOCTYPE_BANK_TRANSACTIONS]
  },
  findDuplicateAccounts,
  hasNoOperations,
  run: async function(ach, dryRun = true) {
    return run(mkAPI(ach.oldClient), dryRun).catch(err => {
      return {
        error: {
          message: err.message,
          stack: err.stack
        }
      }
    })
  }
}
