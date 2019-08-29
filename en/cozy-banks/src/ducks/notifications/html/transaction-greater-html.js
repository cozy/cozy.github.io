const { fromPairs } = require('lodash')
const templates = require('./templates')
const { renderMJML } = require('./utils')
const { prepareTransactions, getCurrentDate } = require('./utils')

export default ({ accounts, transactions, urls }) => {
  const accountsById = fromPairs(
    accounts.map(account => [account._id, account])
  )
  const transactionsByAccounts = prepareTransactions(transactions)

  const data = {
    accounts: accountsById,
    byAccounts: transactionsByAccounts,
    date: getCurrentDate(),
    ...urls
  }

  return renderMJML(templates['transaction-greater'](data))
}
