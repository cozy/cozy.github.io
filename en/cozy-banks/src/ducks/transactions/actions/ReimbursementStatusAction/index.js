import ReimbursementStatusAction from 'ducks/transactions/actions/ReimbursementStatusAction/ReimbursementStatusAction'
import match from 'ducks/transactions/actions/ReimbursementStatusAction/match'

const action = {
  name: 'ReimbursementStatus',
  match,
  Component: ReimbursementStatusAction
}

export default action
