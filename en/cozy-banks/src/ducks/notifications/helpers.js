import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import { getAccountBalance } from 'ducks/account/helpers'

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
