import { combineReducers } from 'redux'
import { createSelector } from 'reselect'
import { parse, format, isWithinRange } from 'date-fns'
import logger from 'cozy-logger'
import {
  getTransactions,
  getAllGroups,
  getAccounts,
  getGroupsById,
  getAccountsById
} from 'selectors'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import find from 'lodash/find'
import keyBy from 'lodash/keyBy'
import last from 'lodash/last'
import sortBy from 'lodash/sortBy'
import { DESTROY_ACCOUNT } from 'actions/accounts'
import { dehydrate } from 'cozy-client'
import { getApplicationDate, getDisplayDate } from 'ducks/transactions/helpers'
import { isHealthExpense } from 'ducks/categories/helpers'

const log = logger.namespace('filters')

// constants
const FILTER_BY_PERIOD = 'FILTER_BY_PERIOD'
const FILTER_BY_DOC = 'FILTER_BY_DOC'
const RESET_FILTER_BY_DOC = 'RESET_FILTER_BY_DOC'
const FILTER_YEAR_MONTH_FORMAT = 'YYYY-MM'
const FILTER_YEAR_FORMAT = 'YYYY'

export const parsePeriod = filter => {
  return parse(
    filter,
    filter.length === 4 ? FILTER_YEAR_FORMAT : FILTER_YEAR_MONTH_FORMAT
  )
}

// filters

const monthFormat = date => {
  return date && date.substr(0, 7)
}

const yearFormat = date => {
  return date && date.substr(0, 4)
}

const isDate = date => date instanceof Date
const isString = str => typeof str === 'string'

export const filterByPeriod = (transactions, period, dateGetter) => {
  let pred
  const l = period.length
  if (isString(period)) {
    if (l === 4) {
      const formatter = yearFormat
      pred = date => formatter(date) === period
    } else if (l === 7) {
      const formatter = monthFormat
      pred = date => formatter(date) === period
    }
  } else if (period.length === 2 && isDate(period[0]) && isDate(period[1])) {
    pred = date => {
      return isWithinRange(parse(date), period[0], period[1])
    }
  } else {
    throw new Error('Invalid period: ' + JSON.stringify(period))
  }

  const realDateGetter = dateGetter || getDisplayDate
  return transactions.filter(transaction => {
    const date = realDateGetter(transaction)
    if (!date) {
      return false
    }
    return pred(date)
  })
}

// selectors
export const getPeriod = state => state.filters && state.filters.period

export const getRawFilteringDoc = state =>
  state.filters && state.filters.filteringDoc

export const getFilteringDoc = createSelector(
  [getAccountsById, getGroupsById, getRawFilteringDoc],
  (accountsById, groupsById, rawFilteringDoc) => {
    if (!rawFilteringDoc) {
      return null
    }

    switch (rawFilteringDoc._type) {
      case ACCOUNT_DOCTYPE:
        return accountsById[rawFilteringDoc._id] || rawFilteringDoc

      case GROUP_DOCTYPE:
        return groupsById[rawFilteringDoc._id] || rawFilteringDoc

      default:
        return rawFilteringDoc
    }
  }
)

export const getFilteredAccountIds = createSelector(
  [getAccounts, getFilteringDoc, getAllGroups],
  (accounts, doc, groups) => {
    const availableAccountIds = accounts.map(x => x._id)
    if (!doc) {
      return availableAccountIds
    }

    const doctype = doc._type
    const id = doc._id

    if (doctype === ACCOUNT_DOCTYPE) {
      if (availableAccountIds.indexOf(id) > -1) {
        return [id]
      } else {
        // eslint-disable-next-line no-console
        return availableAccountIds
      }
    } else if (doctype === GROUP_DOCTYPE) {
      const group = find(groups, { _id: id })
      if (!group) {
        return availableAccountIds
      }
      const accountIds = group.accounts.raw
      if (accountIds) {
        return accountIds
      } else {
        return availableAccountIds
      }
    } else if (Array.isArray(doc)) {
      // In this case we have already been provided with
      // accountsIds
      return doc
    } else {
      log('warn', `The filtering doc '${doc}' doesn't have any type.`)
      return availableAccountIds
    }
  }
)

export const getFilteredAccounts = createSelector(
  [getFilteredAccountIds, getAccounts],
  (accountIds, accounts) => {
    const ids = keyBy(accountIds)
    return accounts.filter(account => ids[account._id])
  }
)

const filterByAccountIds = (transactions, accountIds) =>
  transactions.filter(transaction => {
    return (
      transaction &&
      accountIds.indexOf(transaction.account.raw || transaction.account) !== -1
    )
  })

const recentToAncient = transaction => -new Date(getDisplayDate(transaction))
export const getTransactionsFilteredByAccount = createSelector(
  [getTransactions, getFilteredAccountIds],
  (transactions, accountIds) => {
    let clonedTransactions = transactions
    if (accountIds) {
      clonedTransactions = filterByAccountIds(transactions, accountIds)
    }
    return sortBy(clonedTransactions, recentToAncient)
  }
)

const getPathnameFromLocationProp = (state, ownProps) =>
  ownProps && ownProps.location.pathname

const getApplicationDateOrDisplayDate = transaction => {
  const applicationDate = getApplicationDate(transaction)
  if (applicationDate) {
    return applicationDate
  } else {
    return getDisplayDate(transaction)
  }
}

export const getDateGetter = createSelector(
  [getPathnameFromLocationProp],
  pathname => {
    if (pathname && pathname.startsWith('/analysis/categories')) {
      return getApplicationDateOrDisplayDate
    }
  }
)

export const getFilteredTransactions = createSelector(
  [getTransactionsFilteredByAccount, getPeriod, getDateGetter],
  (transactions, period, dateGetter) => {
    return filterByPeriod(transactions, period, dateGetter)
  }
)

export const getHealthExpenses = createSelector(
  [getTransactions],
  transactions => transactions.filter(isHealthExpense)
)

export const getHealthExpensesByPeriod = createSelector(
  [getHealthExpenses, getPeriod],
  (healthExpenses, period) => {
    return filterByPeriod(healthExpenses, period)
  }
)

// actions
export const addFilterByPeriod = period => ({
  type: FILTER_BY_PERIOD,
  period
})
export const resetFilterByDoc = () => ({ type: RESET_FILTER_BY_DOC })
export const filterByDoc = doc => ({
  type: FILTER_BY_DOC,
  doc: doc && (doc.length ? doc : dehydrate(doc))
})
export const filterByAccounts = accounts => ({
  type: FILTER_BY_DOC,
  doc: accounts.map(x => x._id)
})

export const addFilterForMostRecentTransactions =
  () => (dispatch, getState) => {
    const state = getState()
    const transactions = getTransactionsFilteredByAccount(state)
    const mostRecentTransaction = last(sortBy(transactions, getDisplayDate))
    if (mostRecentTransaction) {
      const date = getDisplayDate(mostRecentTransaction)
      const period = monthFormat(date)
      return dispatch(addFilterByPeriod(period))
    }
  }

// reducers
const getDefaultMonth = () => monthFormat(format(new Date()))
const period = (state = getDefaultMonth(), action) => {
  switch (action.type) {
    case FILTER_BY_PERIOD:
      return action.period
    default:
      return state
  }
}

const filteringDoc = (state = null, action) => {
  switch (action.type) {
    case FILTER_BY_DOC:
      return action.doc || state
    case RESET_FILTER_BY_DOC:
      return null
    default:
      return state
  }
}

const handleDestroyAccount = (state = {}, action) => {
  const { type, account } = action
  if (
    type === DESTROY_ACCOUNT &&
    state.filteringDoc &&
    state.filteringDoc.id === account.id
  ) {
    // reset the filter
    return { ...state, filteringDoc: null }
  }
  return state
}

const composeReducers =
  (...reducers) =>
  (state, action) =>
    reducers.reduce((state, reducer) => reducer(state, action), state)

export default composeReducers(
  combineReducers({
    period,
    filteringDoc
  }),
  handleDestroyAccount
)
