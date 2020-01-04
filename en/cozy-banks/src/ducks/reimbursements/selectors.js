import groupBy from 'lodash/groupBy'
import flag from 'cozy-flags'
import { getHealthExpenses, getHealthExpensesByPeriod } from 'ducks/filters'
import { createSelector } from 'reselect'
import {
  isFullyReimbursed,
  isReimbursementLate,
  getReimbursementStatus
} from 'ducks/transactions/helpers'
import { getHealthReimbursementLateLimit } from 'ducks/settings/helpers'
import { getSettings } from 'ducks/settings/selectors'

const groupHealthExpenses = healthExpenses => {
  const reimbursementTagFlag = flag('reimbursements.tag')

  const groupedTransactions = groupBy(
    healthExpenses,
    reimbursementTagFlag ? getReimbursementStatus : isFullyReimbursed
  )

  const reimbursed =
    (reimbursementTagFlag
      ? groupedTransactions.reimbursed
      : groupedTransactions.true) || []

  const pending =
    (reimbursementTagFlag
      ? groupedTransactions.pending
      : groupedTransactions.false) || []

  return {
    reimbursed,
    pending
  }
}

export const getGroupedHealthExpensesByPeriod = createSelector(
  [getHealthExpensesByPeriod],
  groupHealthExpenses
)

export const getGroupedHealthExpenses = createSelector(
  [getHealthExpenses],
  groupHealthExpenses
)

export const getHealthReimbursementLateLimitSelector = createSelector(
  [getSettings],
  settings => {
    return getHealthReimbursementLateLimit(settings)
  }
)

export const getLateHealthExpenses = createSelector(
  [getGroupedHealthExpenses, getHealthReimbursementLateLimitSelector],
  (groupedHealthExpenses, healthReimbursementLateLimit) =>
    groupedHealthExpenses.pending.filter(tr =>
      isReimbursementLate(tr, healthReimbursementLateLimit)
    )
)
