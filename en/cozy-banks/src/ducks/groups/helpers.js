import every from 'lodash/every'
import get from 'lodash/get'
import sumBy from 'lodash/sumBy'
import deburr from 'lodash/deburr'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'

import flag from 'cozy-flags'
import { HasManyInPlace } from 'cozy-client'

import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import { associateDocuments } from 'ducks/client/utils'
import { getAccountType, getAccountBalance } from 'ducks/account/helpers'
import resultWithArgs from 'utils/resultWithArgs'

// For automatically created groups, the `accountType` attribute is present.
export const isFormerAutoGroup = group => group.accountType === null
export const isAutoGroup = group => group.accountType !== undefined
export const getGroupAccountType = group => group.accountType

export const isReimbursementsVirtualGroup = group =>
  Boolean(group.virtual && group._id === 'Reimbursements')

export const getGroupLabel = (group, t) => {
  if (group == null) {
    return ''
  } else if (isReimbursementsVirtualGroup(group)) {
    return t(`Data.accountTypes.Reimbursements`, { _: 'other' })
  } else if (group.virtual) {
    return (
      t(`Data.accountTypes.${group.accountType}`, { _: 'other' }) +
      (flag('debug-groups') ? ' (virtual)' : '')
    )
  } else if (isAutoGroup(group) && !isFormerAutoGroup(group)) {
    return (
      t(`Data.accountTypes.${group.accountType}`) +
      (flag('debug-groups') ? ' (auto)' : '')
    )
  } else {
    return group.label
  }
}

/**
 * Returns a group balance (all its accounts balance sumed)
 * @param {Object} group
 * @param {string[]} excludedAccountIds - Account ids that should be exclude from the sum
 * @returns {number}
 */
export const getGroupBalance = (group, excludedAccountIds = []) => {
  const accounts = get(group, 'accounts.data')

  if (!accounts) {
    return 0
  }

  const accountsToSum = accounts
    .filter(Boolean)
    .filter(account => !excludedAccountIds.includes(account._id))

  return sumBy(accountsToSum, getAccountBalance)
}

export const buildAutoGroup = (accountType, accounts, options = {}) => {
  const { virtual = true, client = null } = options

  const group = {
    _type: GROUP_DOCTYPE,
    label: accountType,
    accountType: accountType
  }

  if (virtual) {
    group.virtual = true
    group._id = accountType
  }

  associateDocuments(group, 'accounts', ACCOUNT_DOCTYPE, accounts)

  if (client) {
    group.accounts = accounts.map(x => x._id)
    return client.hydrateDocument(group)
  } else {
    associateDocuments(group, 'accounts', ACCOUNT_DOCTYPE, accounts)
    return group
  }
}

export const buildAutoGroups = (accounts, options) => {
  const accountsByType = groupBy(accounts, getAccountType)

  const virtualGroups = Object.entries(accountsByType).map(
    ([accountType, accounts]) => buildAutoGroup(accountType, accounts, options)
  )

  return virtualGroups
}

/**
 * Returns a function that returns the translated label of a group
 *
 * @param {Object} group - Group
 * @param {Function} translate - Translation function
 * @returns {Object} Translated label
 */

const isOtherVirtualGroup = group => group.virtual && group.label === 'Other'

const getCategory = group => {
  if (isReimbursementsVirtualGroup(group)) {
    return 'virtualReimbursements'
  } else if (isOtherVirtualGroup(group)) {
    return 'virtualOther'
  } else {
    return 'normal'
  }
}

const groupSortingPriorities = {
  normal: 0,
  virtualOther: 1,
  virtualReimbursements: group => {
    const balance = getGroupBalance(group)
    if (flag('demo') || flag('balance.reimbursements-top-position')) {
      // Must be first if we have reimbursements waiting
      return balance > 0 ? -1 : 2
    } else {
      return 2
    }
  }
}
const getGroupPriority = wrappedGroup =>
  resultWithArgs(groupSortingPriorities, wrappedGroup.category, [
    wrappedGroup.group
  ])

/**
 * Translate groups labels then sort them on their translated label. But always put "others accounts" last
 * @param {Object[]} groups - The groups to sort
 * @param {Function} translate - The translation function
 * @returns {Object[]} The sorted wrapped groups ({ category, label, group })
 */
export const translateAndSortGroups = (groups, translate) => {
  // Wrap groups to add necessary information for sorting
  const wrappedGroups = groups.map(group => ({
    group,
    category: getCategory(group),
    label: getGroupLabel(group, translate)
  }))

  return sortBy(wrappedGroups, wrappedGroup => [
    getGroupPriority(wrappedGroup),
    deburr(wrappedGroup.label).toLowerCase()
  ])
}

export const renamedGroup = (group, label) => {
  const updatedGroup = {
    ...group,
    label
  }

  if (group.accountType) {
    // As soon as the account is renamed it loses its accountType
    updatedGroup.accountType = null
  }

  return updatedGroup
}

export const isLoanAccount = account =>
  account ? getAccountType(account) == 'Loan' : false
export const isLoanGroup = group => {
  return group.accounts && group.accounts.data
    ? every(group.accounts.data, isLoanAccount)
    : false
}

export const getGroupAccountIds = group => {
  return group.accounts
    ? group.accounts instanceof HasManyInPlace
      ? group.accounts.raw
      : group.accounts
    : []
}
