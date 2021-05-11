import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import toPairs from 'lodash/toPairs'
import flow from 'lodash/flow'
import unique from 'lodash/uniq'
import get from 'lodash/get'
import { getDate } from 'ducks/transactions/helpers'

export const prepareTransactions = function(transactions) {
  const byAccounts = groupBy(transactions, tr => tr.account)

  const groupAndSortByDate = flow(
    transactions => groupBy(transactions, getDate),
    toPairs,
    dt => sortBy(dt, ([date]) => date).reverse()
  )
  Object.keys(byAccounts).forEach(account => {
    byAccounts[account] = groupAndSortByDate(byAccounts[account])
  })

  return byAccounts
}

const billIdFromReimbursement = reimbursement => {
  return reimbursement.billId && reimbursement.billId.split(':')[1]
}

export const treatedByFormat = function(reimbursements, billsById) {
  if (!billsById) {
    throw new Error('No billsById passed')
  }
  const vendors = unique(
    (reimbursements || [])
      .map(reimbursement => {
        const billId = billIdFromReimbursement(reimbursement)
        return get(billsById, billId + '.vendor')
      })
      .filter(x => x && x !== '')
  )

  if (!vendors.length) {
    throw new Error('No vendor found')
  }
  return vendors.join(', ')
}

export const getCurrentDate = () => {
  return new Date()
}

export const formatAmount = amount =>
  amount % 1 !== 0 ? amount.toFixed(2) : amount
