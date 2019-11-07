import { getGroups, getAccounts } from 'selectors'
import { createSelector } from 'reselect'
import keyBy from 'lodash/keyBy'

export const getGroupsById = createSelector(
  [getGroups],
  groups => keyBy(groups, '_id')
)

export const getAccountsById = createSelector(
  [getAccounts],
  accounts => keyBy(accounts, '_id')
)
