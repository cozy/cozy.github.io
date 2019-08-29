import { find, filter } from 'lodash'
import KonnectorAction from 'ducks/transactions/actions/KonnectorAction'
import HealthLinkAction from 'ducks/transactions/actions/HealthLinkAction'
import AppLinkAction from 'ducks/transactions/actions/AppLinkAction'
import UrlLinkAction from 'ducks/transactions/actions/UrlLinkAction'
import BillAction from 'ducks/transactions/actions/BillAction'
import AlertAction from 'ducks/transactions/actions/AlertAction'
import CommentAction from 'ducks/transactions/actions/CommentAction'
import AttachAction from 'ducks/transactions/actions/AttachAction'
import HealthExpenseAction from 'ducks/transactions/actions/HealthExpenseAction'
import HealthExpenseStatusAction from 'ducks/transactions/actions/HealthExpenseStatusAction'
import ReimbursementStatusAction from 'ducks/transactions/actions/ReimbursementStatusAction'
import AttachedDocsAction from 'ducks/transactions/actions/AttachedDocsAction'

const actions = {
  AttachedDocsAction,
  HealthExpenseStatusAction: HealthExpenseStatusAction,
  HealthExpenseAction: HealthExpenseAction,
  HealthLinkAction: HealthLinkAction,
  BillAction: BillAction,
  KonnectorAction: KonnectorAction,
  UrlLinkAction: UrlLinkAction,
  AppLinkAction: AppLinkAction,
  AttachAction: AttachAction,
  CommentAction: CommentAction,
  AlertAction: AlertAction,
  ReimbursementStatusAction
}

export const findMatchingActions = async (transaction, actionProps) => {
  const matchingActions = []

  for (const [actionName, action] of Object.entries(actions)) {
    try {
      const matching = await action.match(transaction, actionProps)
      if (matching) {
        matchingActions.push(action)
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('action matching failed', actionName) // eslint-disable-line no-console
        console.warn(e) // eslint-disable-line no-console
      }
    }
  }

  const defaultAction = find(
    matchingActions,
    action => action.defaultAction !== false && action.disabled !== true
  )
  const othersAction = filter(
    matchingActions,
    action => action !== defaultAction
  )

  return {
    default: defaultAction,
    others: othersAction
  }
}

export const getActionFromName = name => {
  return find(actions, action => action.name === name)
}
