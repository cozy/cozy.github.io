const keyBy = require('lodash/keyBy')
const templates = require('./templates')
const { renderMJML } = require('./utils')
const { prepareTransactions, getCurrentDate } = require('./utils')

export default ({ accounts, transactions, urls }) => {
  const accountsById = keyBy(accounts, '_id')
  const transactionsByAccounts = prepareTransactions(transactions)

  const data = {
    accounts: accountsById,
    byAccounts: transactionsByAccounts,
    date: getCurrentDate(),
    ...urls
  }

  return renderMJML(templates['late-health-reimbursement'](data))
}
