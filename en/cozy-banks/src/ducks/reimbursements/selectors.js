import groupBy from 'lodash/groupBy'
import {
  getHealthExpenses,
  getHealthExpensesByPeriod,
  getFilteringDoc,
  filterByPeriod,
  getPeriod,
  getDateGetter
} from 'ducks/filters'
import { getTransactions } from 'selectors'
import { createSelector } from 'reselect'
import {
  isReimbursementLate,
  getReimbursementStatus,
  isExpense
} from 'ducks/transactions/helpers'
import { getHealthReimbursementLateLimit } from 'ducks/settings/helpers'
import { getSettings } from 'ducks/settings/selectors'
import {
  reimbursementsVirtualAccountsSpecs,
  othersFilter
} from 'ducks/account/helpers'

const groupExpenses = expenses => {
  const { reimbursed = [], pending = [] } = groupBy(
    expenses,
    getReimbursementStatus
  )

  return {
    reimbursed,
    pending
  }
}

export const getGroupedHealthExpensesByPeriod = createSelector(
  [getHealthExpensesByPeriod],
  groupExpenses
)

export const getGroupedHealthExpenses = createSelector(
  [getHealthExpenses],
  groupExpenses
)

export const getExpensesByFilteringDoc = createSelector(
  [getTransactions, getFilteringDoc],
  (transactions, filteringDoc) => {
    let filter

    if (filteringDoc._type === 'io.cozy.bank.accounts') {
      filter = filteringDoc.categoryId
        ? reimbursementsVirtualAccountsSpecs[filteringDoc.categoryId].filter
        : othersFilter
    } else if (filteringDoc._type === 'io.cozy.bank.groups') {
      filter = isExpense
    }

    return transactions.filter(filter)
  }
)

export const getFilteredExpenses = createSelector(
  [getExpensesByFilteringDoc, getPeriod, getDateGetter],
  (transactions, period, dateGetter) => {
    return filterByPeriod(transactions, period, dateGetter)
  }
)

export const getGroupedFilteredExpenses = createSelector(
  [getFilteredExpenses],
  groupExpenses
)

export const getHealthReimbursementLateLimitSelector = createSelector(
  [getSettings],
  settings => getHealthReimbursementLateLimit(settings)
)

export const getLateHealthExpenses = createSelector(
  [getGroupedHealthExpenses, getHealthReimbursementLateLimitSelector],
  (groupedHealthExpenses, healthReimbursementLateLimit) =>
    groupedHealthExpenses.pending.filter(tr =>
      isReimbursementLate(tr, healthReimbursementLateLimit)
    )
)
