import flag from 'cozy-flags'
import { isExpense } from 'ducks/transactions/helpers'

const match = transaction => {
  // TODO match only if the component is going to render something
  return isExpense(transaction) && flag('reimbursement-tag')
}

export default match
