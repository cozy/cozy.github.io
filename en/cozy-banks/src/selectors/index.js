import keyBy from 'lodash/keyBy'
import isEqual from 'lodash/isEqual'
import { createSelector, createSelectorCreator, defaultMemoize } from 'reselect'

import { getQueryFromState } from 'cozy-client'

import { ACCOUNT_DOCTYPE, TRANSACTION_DOCTYPE } from 'doctypes'
import { buildAutoGroups, isAutoGroup } from 'ducks/groups/helpers'
import {
  buildVirtualAccounts,
  isReimbursementsAccount
} from 'ducks/account/helpers'
import {
  getDefaultedSettings,
  isConfigurationSetting,
  getNotificationFromConfig,
  getWarningLimitsPerAccount as getWarningLimitsPerAccountRaw
} from 'ducks/settings/helpers'
import getClient from 'selectors/getClient'

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
  queryCreateSelector(
    [querySelector(queryName, options)],
    query => (query && query.data) || []
  )

export const documentSelector = createSelector(
  state => ({ ...state.cozy.documents[TRANSACTION_DOCTYPE] }),
  documents => {
    const client = getClient()
    const docs = Object.values(documents || {})
    return client.hydrateDocuments(TRANSACTION_DOCTYPE, docs)
  },
  {
    memoizeOptions: {
      equalityCheck: (a, b) => isEqual(a, b)
    }
  }
)

export const getTransactionsRaw = createSelector(
  documentSelector,
  partialTransactions => {
    return partialTransactions.filter(x => !!x.label)
  }
)

export const getGroups = queryDataSelector('groups', {
  hydrated: true
})

export const getSettings = queryDataSelector('settings', {
  hydrated: true
})

export const getConfig = createSelector(getSettings, settings =>
  getDefaultedSettings(settings.find(isConfigurationSetting))
)

export const getAccounts = queryDataSelector('accounts')
export const getRecurrences = queryDataSelector('recurrence', {
  hydrated: true
})

export const getTransactions = createSelector(
  getTransactionsRaw,
  transactions => transactions.filter(Boolean)
)

export const getVirtualAccounts = createSelector(
  getTransactions,
  transactions => buildVirtualAccounts(transactions)
)

export const getAllAccounts = createSelector(
  [getAccounts, getVirtualAccounts],
  (accounts, virtualAccounts) => [...accounts, ...virtualAccounts]
)

export const getAutoGroups = createSelector(getGroups, groups =>
  groups.filter(isAutoGroup)
)

export const getVirtualGroups = createSelector(
  [getAllAccounts, getAutoGroups],
  (accounts, autoGroups) => {
    // While autogroups service has not run, we display virtual groups
    // to the user
    if (autoGroups.length === 0) {
      return buildAutoGroups(accounts, { virtual: true })
    } else {
      return buildAutoGroups(accounts.filter(isReimbursementsAccount), {
        virtual: true
      })
    }
  }
)

export const getWarningLimitPerAccount = createSelector(
  [getConfig, getAccounts, getGroups],
  (config, accounts, groups) => {
    const balanceLowerRules = getNotificationFromConfig(config, 'balanceLower')
    return getWarningLimitsPerAccountRaw(balanceLowerRules, accounts, groups)
  }
)

export const getHydratedAccountsFromGroup = (state, group, client) => {
  const rawAccounts = group.accounts.data
    .filter(Boolean)
    .map(
      account =>
        client.getDocumentFromState(ACCOUNT_DOCTYPE, account._id) || account
    )
  return client.hydrateDocuments(ACCOUNT_DOCTYPE, rawAccounts)
}

export const getAllGroups = createSelector(
  [getGroups, getVirtualGroups],
  (groups, virtualGroups) => [...groups, ...virtualGroups]
)

export const getGroupsById = createSelector(getAllGroups, groups =>
  keyBy(groups, '_id')
)

export const getAccountsById = createSelector(getAccounts, accounts =>
  keyBy(accounts, '_id')
)
