import { isExpense } from 'ducks/transactions/helpers'

const match = transaction => {
  // For the modal row, we need to match independently of the reimbursement status
  // since we have to show a "No reimbursements" line when no reimbursement expected.
  // It is different for the transaction row chip where should only show a reimbursement
  // chip if a reimbursement is expected/reimbursed. At the moment, matching is done for
  // both purposes (transaction modal and transaction list), it might make sense to decouple
  // the "transaction list matching" from the "modal row matching".
  return isExpense(transaction)
}

export default match
