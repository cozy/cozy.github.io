import { createSelector } from 'reselect'
import { buildAutoGroups, isAutoGroup } from 'ducks/groups/helpers'
import { buildVirtualAccounts } from 'ducks/account/helpers'

import { getQueryFromState } from 'cozy-client'

const querySelector = queryName => state => getQueryFromState(state, queryName)

export const queryDataSelector = queryName =>
  createSelector(
    [querySelector(queryName)],
    query => (query && query.data) || []
  )

export const getTransactionsRaw = queryDataSelector('transactions')
export const getGroups = queryDataSelector('groups')
export const getAccounts = queryDataSelector('accounts')
export const getApps = queryDataSelector('apps')

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

export const getAppUrlById = createSelector(
  [getApps],
  (apps, id) => {
    if (apps && apps.length > 0) {
      for (const app of apps) {
        if (app._id === id) {
          return app.links.related
        }
      }
    }
    return
  }
)
