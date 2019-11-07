import { createSelector, createSelectorCreator, defaultMemoize } from 'reselect'
import { buildAutoGroups, isAutoGroup } from 'ducks/groups/helpers'
import { buildVirtualAccounts } from 'ducks/account/helpers'
import { getQueryFromState } from 'cozy-client'
import getClient from './getClient'

const updatedAtSameTime = (currentQuery, prevQuery) => {
  return (
    currentQuery &&
    prevQuery &&
    currentQuery.lastUpdate === prevQuery.lastUpdate
  )
}

const queryCreateSelector = createSelectorCreator(
  defaultMemoize,
  updatedAtSameTime
)

const hydratedQuery = queryResult => {
  // We need the client here since selectors that are directly exported
  // from cozy-client cannot hydrate. We should find a better way to do
  // that :
  //  - Be able to hydrate without a client.
  //  - Put the schema inside the store.
  //  - The problem is that some methods used by relationships are bound
  //    to the client
  const client = getClient()
  const doctype = queryResult.definition && queryResult.definition.doctype
  const data = client.hydrateDocuments(doctype, queryResult.data)
  return { ...queryResult, data }
}

const getRawQuery = queryName => state => getQueryFromState(state, queryName)

/**
 * Hydratation is expensive as it creates new objects that do not play well
 * with React's triple equal checks to bypass renders.
 * This is why we memoize based on the queryResult which should change
 * identity more rarely (only when updating results inside).
 */
const getHydratedQuery = queryName =>
  queryCreateSelector([getRawQuery(queryName)], hydratedQuery)

export const querySelector = (queryName, options = {}) => {
  return options.hydrated ? getHydratedQuery(queryName) : getRawQuery(queryName)
}

export const queryDataSelector = (queryName, options) =>
  createSelector(
    [querySelector(queryName, options)],
    query => (query && query.data) || []
  )

export const getTransactionsRaw = queryDataSelector('transactions', {
  hydrated: true
})
export const getGroups = queryDataSelector('groups', {
  hydrated: true
})
export const getAccounts = queryDataSelector('accounts')

export const getTransactions = createSelector(
  [getTransactionsRaw],
  transactions => transactions.filter(Boolean)
)

export const getVirtualAccounts = createSelector(
  [getTransactions],
  transactions => buildVirtualAccounts(transactions)
)

export const getAllAccounts = createSelector(
  [getAccounts, getVirtualAccounts],
  (accounts, virtualAccounts) => [...accounts, ...virtualAccounts]
)

export const getAutoGroups = createSelector(
  [getGroups],
  groups => groups.filter(isAutoGroup)
)

const isHealthReimbursementVirtualAccount = account =>
  account._id === 'health_reimbursements'

export const getVirtualGroups = createSelector(
  [getAllAccounts, getAutoGroups],
  (accounts, autoGroups) => {
    // While autogroups service has not run, we display virtual groups
    // to the user
    if (autoGroups.length === 0) {
      return buildAutoGroups(accounts, { virtual: true })
    } else {
      return buildAutoGroups(
        accounts.filter(isHealthReimbursementVirtualAccount),
        { virtual: true }
      )
    }
  }
)

export const getAllGroups = createSelector(
  [getGroups, getVirtualGroups],
  (groups, virtualGroups) => [...groups, ...virtualGroups]
)
