import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import toPairs from 'lodash/toPairs'
import flow from 'lodash/flow'
import get from 'lodash/get'

import logger from 'cozy-logger'

import { getAccountBalance } from 'ducks/account/helpers'
import { ONE_DAY } from 'ducks/recurrence/constants'
import { getDate } from 'ducks/transactions/helpers'

export const isTransactionAmountGreaterThan = max => transaction => {
  // Math.abs(null) === 0
  if (max === null) return false
  const maxAmount = Math.abs(max)

  return Math.abs(transaction.amount) > maxAmount
}

export const getReimbursementBillId = reimbursement =>
  reimbursement.billId && reimbursement.billId.split(':')[1]

export const getReimbursementBillIds = transactions => {
  const billIds = uniq(
    flatten(
      transactions.map(transaction => {
        return (
          transaction.reimbursements &&
          transaction.reimbursements.map(getReimbursementBillId)
        )
      })
    )
  ).filter(Boolean)

  return billIds
}

export const getAccountNewBalance = creditCard => {
  return (
    getAccountBalance(creditCard.checkingsAccount.data) +
    getAccountBalance(creditCard)
  )
}

/**
 * Returns the next date at 5AM server local time (UTC for cozy server)
 * if current date is between 22h - 5h
 */
export const getScheduleDate = currentDate => {
  let date = new Date(currentDate)
  const hours = 5
  const minutes = Math.round(15 * Math.random())

  if (date.getHours() >= 22) {
    date = new Date(+date + ONE_DAY)
  }

  if (date.getHours() <= 4 || date.getHours() >= 22) {
    date.setHours(hours)
    date.setMinutes(minutes)
  }

  return date
}

/**
 * Returns undefined or the scheduled date if it is in the future
 */
export const makeAtAttributes = notificationName => {
  const date = new Date()
  const scheduledDate = getScheduleDate(date)

  if (date < scheduledDate) {
    const newDate = scheduledDate.toISOString()
    logger(
      'info',
      `[🔔 notifications] ➡️ Scheduling notification for ${notificationName} at ${newDate}`
    )
    return newDate
  }

  logger(
    'info',
    `[🔔 notifications] ➡️ Sending notification for ${notificationName} right now`
  )
  return undefined
}

export const prepareTransactions = function (transactions) {
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

export const treatedByFormat = function (reimbursements, billsById) {
  if (!billsById) {
    throw new Error('No billsById passed')
  }
  const vendors = uniq(
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

export const formatAmount = (amount, censoring) => {
  if (censoring) {
    return '***,**'
  }
  const formattedAmount = Math.abs(amount)
    .toFixed(2)
    .replace('.00', '')
    .replace('.', ',')
  const sign = formattedAmount !== '0' && amount < 0 ? '-' : ''
  return `${sign}${formattedAmount}`
}

export const formatAmountWithSign = (amount, censoring) => {
  if (censoring) {
    return '***,**'
  }
  const formattedAmount = formatAmount(amount, false)
  const sign = formattedAmount !== '0' && amount > 0 ? '+' : ''
  return `${sign}${formattedAmount}`
}
