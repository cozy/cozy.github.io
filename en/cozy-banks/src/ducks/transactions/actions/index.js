import filter from 'lodash/filter'
import find from 'lodash/find'
import KonnectorAction from 'ducks/transactions/actions/KonnectorAction'
import HealthLinkAction from 'ducks/transactions/actions/HealthLinkAction'
import AppLinkAction from 'ducks/transactions/actions/AppLinkAction'
import UrlLinkAction from 'ducks/transactions/actions/UrlLinkAction'
import ReimbursementStatusAction from 'ducks/transactions/actions/ReimbursementStatusAction'
import AttachedDocsAction from 'ducks/transactions/actions/AttachedDocsAction'

const actions = [
  ['AttachedDocsAction', AttachedDocsAction],
  ['HealthLinkAction', HealthLinkAction],
  ['AppLinkAction', AppLinkAction],
  ['KonnectorAction', KonnectorAction],
  ['UrlLinkAction', UrlLinkAction],
  ['ReimbursementStatusAction', ReimbursementStatusAction]
]

export const findMatchingActions = async (transaction, actionProps) => {
  const matchingActions = []

  for (const [actionName, action] of actions) {
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
