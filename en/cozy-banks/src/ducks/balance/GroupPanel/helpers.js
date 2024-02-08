import { getLateHealthExpenses } from 'ducks/reimbursements/selectors'
import { getSettings } from 'ducks/settings/selectors'
import { getNotificationFromSettings } from 'ducks/settings/helpers'
import { isReimbursementsVirtualGroup } from 'ducks/groups/helpers'

import styles from 'ducks/balance/GroupPanel/GroupPanel.styl'

export const getGroupPanelSummaryClasses = (group, state) => {
  if (!isReimbursementsVirtualGroup(group)) {
    return
  }

  const lateHealthExpenses = getLateHealthExpenses(state)
  const hasLateHealthExpenses = lateHealthExpenses.length > 0
  const settings = getSettings(state)
  const lateHealthExpensesNotification = getNotificationFromSettings(
    settings,
    'lateHealthReimbursement'
  )

  if (
    hasLateHealthExpenses &&
    lateHealthExpensesNotification &&
    lateHealthExpensesNotification.enabled
  ) {
    return {
      root: styles['GroupPanelSummary--lateHealthReimbursements']
    }
  }
}
