import flag from 'cozy-flags'
import {
  getReimbursementStatus,
  REIMBURSEMENTS_STATUS
} from 'ducks/transactions/helpers'

const match = transaction => {
  const status = getReimbursementStatus(transaction)
  return (
    status !== REIMBURSEMENTS_STATUS.noReimbursement &&
    flag('reimbursements.tag')
  )
}

export default match
