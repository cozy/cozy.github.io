import { createSelector } from 'reselect'
import addDays from 'date-fns/add_days'
import isAfter from 'date-fns/is_after'
import parse from 'date-fns/parse'
import differenceInDays from 'date-fns/difference_in_days'
import get from 'lodash/get'
import orderBy from 'lodash/orderBy'

import { getRecurrences } from 'selectors'
import { getFilteredAccountIds } from 'ducks/filters'
import { nextDate, STATUS_FINISHED } from 'ducks/recurrence'
import { isFinished } from 'ducks/recurrence/api'
import getClient from 'selectors/getClient'
import { TRANSACTION_DOCTYPE } from 'doctypes'

export const getMaxDate = () => {
  return addDays(new Date(Date.now()), 30).toISOString().slice(0, 10)
}

const FOUR_MONTHS_IN_DAYS = 4 * 30
const RECURRENCE_MAX_AGE_FOR_PLANNING = FOUR_MONTHS_IN_DAYS
const MIN_MEDIAN_FOR_PLANNING = 15

/**
 * Returns whether a recurrence should generate planned transactions
 */
export const isDeprecatedBundle = recurrence => {
  if (isFinished(recurrence)) {
    return true
  }
  const now = Date.now()
  const latestDate = parse(recurrence.latestDate)
  const deltaToNow = differenceInDays(now, latestDate)
  return deltaToNow >= RECURRENCE_MAX_AGE_FOR_PLANNING
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

      if (isDeprecatedBundle(recurrence)) {
        continue
      }

      const median = get(recurrence, 'stats.deltas.median')
      if (!median || median < MIN_MEDIAN_FOR_PLANNING) {
        continue
      }

      const futureDate = nextDate(recurrence)
      if (isAfter(now, futureDate) || isAfter(futureDate, maxDate)) {
        continue
      }

      const transaction = client.hydrateDocument({
        _type: TRANSACTION_DOCTYPE,
        label: recurrence.manualLabel || recurrence.automaticLabel,
        date: futureDate.toISOString(),
        amount: recurrence.latestAmount || recurrence.amounts[0],
        account: lastBankAccount,
        manualCategoryId: recurrence.categoryIds[0],
        automaticCategoryId: recurrence.categoryIds[0]
      })
      res.push(transaction)
    }
    return orderBy(res, ['date'], ['desc'])
  }
)
