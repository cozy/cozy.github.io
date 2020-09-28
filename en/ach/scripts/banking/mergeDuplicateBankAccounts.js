const groupBy = require('lodash/groupBy')
const maxBy = require('lodash/maxBy')
const minBy = require('lodash/minBy')
const mapKeys = require('lodash/mapKeys')
const fromPairs = require('lodash/fromPairs')
const some = require('lodash/some')

const mkAPI = require('../api')
const mutations = require('./mutations')

const BANK_TRANSACTIONS = 'io.cozy.bank.operations'
const BANK_ACCOUNTS = 'io.cozy.bank.accounts'
const BANK_GROUPS = 'io.cozy.bank.groups'

const { matchAccounts } = require('cozy-doctypes/src/banking/matching-accounts')

const strictMethods = [
  'originalNumber-exact',
  'iban-exact',
  'number-exact',
  'vendorId-exact'
]

const isStrictMatchingMethod = method => {
  return some(strictMethods.map(sm => method.includes(sm)))
}

const maxValueBy = (arr, iter) => iter(maxBy(arr, iter))
const minValueBy = (arr, iter) => iter(minBy(arr, iter))

const transactionCounter = trByAccount => account => {
  return (trByAccount[account._id] || []).length
}

/**
 * The account with the least transactions is merged
 * to the account with the most transactions.
 */
const getWinnerLoser = (couple, trByAccount) => {
  const count = transactionCounter(trByAccount)
  const [left, right] = couple

  const winner = count(left) > count(right) ? left : right
  const loser = winner === left ? right : left
  return [winner, loser]
}

const getTransactionDate = tr => {
  return tr ? tr.realisationDate || tr.date : 'NA'
}

const getBalance = account => {
  if (account.type == 'CreditCard' && account.comingBalance !== undefined) {
    return account.comingBalance
  } else {
    return account.balance
  }
}

const shortFmtDate = date => {
  return date.substr(0, 10)
}

const shortFmt = (account, trByAccount) => {
  const count = transactionCounter(trByAccount)
  return `${account.label} (${count(account)}ops) (${getBalance(
    account
  )}${account.currency || 'EUR'})`
}

/**
 * Only merge transactions that are after the splitDate (the max
 * date contained in the winner account)
 */
const getMissedTransactions = (winner, loser, trByAccount) => {
  const splitDate = maxValueBy(trByAccount[winner._id], getTransactionDate)
  return (trByAccount[loser._id] || []).filter(
    x => getTransactionDate(x) > splitDate
  )
}

/**
 * Builds an object describing the operations to execute on each
 * doctype.
 */
const mkMergeMutation = (winner, loser, trByAccount, groupsByAccount) => {
  const missedOps = getMissedTransactions(winner, loser, trByAccount)

  for (const op of missedOps) {
    op.account = winner._id
  }

  let updatedGroups = []
  for (let group of groupsByAccount[loser._id]) {
    const idx = group.accounts.indexOf(loser._id)
    if (idx > -1) {
      group.accounts[idx] = winner._id
    }
    updatedGroups.push(group)
  }

  const minDate = minValueBy(missedOps, getTransactionDate)
  const maxDate = maxValueBy(missedOps, getTransactionDate)

  console.log(
    `Missed operations ranging from ${shortFmtDate(minDate)} to ${shortFmtDate(
      maxDate
    )}`
  )

  return {
    toUpdate: {
      'io.cozy.bank.operations': missedOps,
      'io.cozy.bank.groups': updatedGroups
    },
    toDelete: {
      'io.cozy.bank.accounts': [loser]
    }
  }
}

const translateFields = (obj, translations) => {
  return mapKeys(obj, (value, key) => translations[key] || key)
}

const findAttrMatch = (obj, others, attr) => {
  for (const other of others) {
    if (other[attr] && other[attr] === obj[attr]) {
      return {
        needle: obj,
        match: other,
        method: attr + '-exact'
      }
    }
  }
}

/**
 * Match 1 account to other accounts.
 * Adds vendorId matching method to the regular methods.
 */
const matchOneAccount = (account, accounts) => {
  const vendorIdMatch = findAttrMatch(account, accounts, 'vendorId')
  if (vendorIdMatch) {
    return translateFields(vendorIdMatch, { needle: 'account' })
  }
  return matchAccounts([account], accounts.filter(acc => acc !== account))[0]
}

/**
 * Find accounts that can be merged following the matching rules.
 * When a match is found, the account with the most transactions
 * is considered the winner.
 *
 * Only strict matching methods are considered here.
 */
const findMergeableCouples = async data => {
  const { accounts, trByAccount } = data

  const couples = []
  const matches = new Set()

  for (const account of accounts) {
    if (matches.has(account._id)) {
      continue
    }
    const result = matchOneAccount(
      account,
      accounts.filter(acc => acc !== account)
    )
    const { match, method } = result
    if (match) {
      matches.add(match._id)
      if (isStrictMatchingMethod(method)) {
        const [winner, loser] = getWinnerLoser([account, match], trByAccount)
        couples.push([winner, loser])
      }
    }
  }

  return couples
}

/**
 * Will perform database operations to merge account couples.
 *
 * - The loser account is deleted.
 * - The loser account is replaced by the winner account in groups.
 * - Transactions linked to the loser account are linked to the winner
 */
const mergeCouples = async (couples, data, api, dryRun) => {
  const { trByAccount } = data
  const groupedByInstitution = groupBy(couples, x => x[0].institutionLabel)
  for (const couples of Object.values(groupedByInstitution)) {
    console.log(couples[0][0].institutionLabel)
    for (const [winner, loser] of couples) {
      console.log(
        `Merging ${shortFmt(loser, trByAccount)} to ${shortFmt(
          winner,
          trByAccount
        )}`
      )
      const mutation = mkMergeMutation(
        winner,
        loser,
        data.trByAccount,
        data.groupsByAccount
      )
      if (dryRun) {
        mutations.display(mutation)
      } else {
        await mutations.execute(mutation, api)
      }
      console.log()
    }
  }
}

const fetchData = async api => {
  const transactions = await api.fetchAll(BANK_TRANSACTIONS)
  const trByAccount = groupBy(transactions, x => x.account)
  const accounts = await api.fetchAll(BANK_ACCOUNTS)
  const groups = await api.fetchAll(BANK_GROUPS)
  const groupsByAccount = fromPairs(
    accounts.map(acc => [
      acc._id,
      groups.filter(group => group.accounts.includes(acc._id))
    ])
  )
  return {
    transactions,
    accounts,
    groups,
    trByAccount,
    groupsByAccount
  }
}

const run = async (api, dryRun) => {
  const data = await fetchData(api)
  const couples = await findMergeableCouples(data)
  await mergeCouples(couples, data, api, dryRun)
}

module.exports = {
  getDoctypes: function() {
    return [BANK_TRANSACTIONS, BANK_ACCOUNTS, BANK_GROUPS]
  },

  run: async function(ach, dryRun = true) {
    const api = mkAPI(ach.oldClient)
    await run(api, dryRun)
  }
}
