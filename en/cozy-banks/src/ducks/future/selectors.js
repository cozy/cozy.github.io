import { createSelector } from 'reselect'
import addDays from 'date-fns/add_days'

import { getRecurrences } from 'selectors'
import { getFilteredAccountIds } from 'ducks/filters'
import { nextDate, STATUS_FINISHED } from 'ducks/recurrence'
import getClient from 'selectors/getClient'
import { TRANSACTION_DOCTYPE } from 'doctypes'
import isAfter from 'date-fns/is_after'

export const getMaxDate = () => {
  return addDays(new Date(Date.now()), 30)
    .toISOString()
    .slice(0, 10)
}

/**
 * Returns planned transactions based on recurrences
 */
export const getPlannedTransactions = createSelector(
  [getRecurrences, getFilteredAccountIds, getMaxDate],
  (recurrences, filteredAccountIds, maxDateArg) => {
    const client = getClient()
    const res = []
    const now = new Date()
    const maxDate = new Date(maxDateArg)
    for (let recurrence of recurrences) {
      if (recurrence.status === STATUS_FINISHED) {
        continue
      }

      if (!recurrence.latestDate) {
        continue
      }

      const lastBankAccount = recurrence.accounts && recurrence.accounts[0]
      if (
        filteredAccountIds &&
        filteredAccountIds.indexOf(lastBankAccount) === -1
      ) {
        continue
      }

      const futureDate = nextDate(recurrence)
      if (isAfter(now, futureDate) || isAfter(futureDate, maxDate)) {
        continue
      }

      const transaction = client.hydrateDocument({
        _type: TRANSACTION_DOCTYPE,
        label: recurrence.automaticLabel,
        date: futureDate.toISOString(),
        amount: recurrence.amounts[0],
        account: lastBankAccount,
        manualCategoryId: recurrence.categoryIds[0],
        automaticCategoryId: recurrence.categoryIds[0]
      })
      res.push(transaction)
    }
    return res
  }
)
