import { groupBy, sortBy, deburr } from 'lodash'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import { associateDocuments } from 'ducks/client/utils'
import { getAccountType } from 'ducks/account/helpers'

export const buildVirtualGroup = (type, accounts) => {
  const group = {
    _id: type,
    _type: GROUP_DOCTYPE,
    label: type,
    virtual: true
  }

  associateDocuments(group, 'accounts', ACCOUNT_DOCTYPE, accounts)

  return group
}

export const buildVirtualGroups = (accounts, translate) => {
  const accountsByType = groupBy(accounts, account =>
    getAccountType(account, translate)
  )

  const virtualGroups = Object.entries(accountsByType).map(([type, accounts]) =>
    buildVirtualGroup(type, accounts)
  )

  return virtualGroups
}

/**
 * Translate group properties
 * @param {Object} group - The group to translate
 * @param {Function} translate - The translation function
 * @returns {Object} The translated group
 */
export const translateGroup = (group, translate) => {
  return {
    ...group,
    label: group.virtual
      ? translate(`Data.accountTypes.${group.label}`, { _: 'other' })
      : group.label
  }
}

const isOtherVirtualGroup = group => group.virtual && group.label === 'Other'
export const isReimbursementsVirtualGroup = group =>
  group.virtual && group._id === 'Reimbursements'

/**
 * Translate groups labels then sort them on their translated label. But always put "others accounts" last
 * @param {Object[]} groups - The groups to sort
 * @param {Function} translate - The translation function
 * @returns {Object[]} The sorted groups
 */
export const translateAndSortGroups = (groups, translate) => {
  const groupsToSort = groups
    .filter(
      group =>
        !isOtherVirtualGroup(group) && !isReimbursementsVirtualGroup(group)
    )
    .map(group => translateGroup(group, translate))

  const sortedGroups = sortBy(groupsToSort, group =>
    deburr(group.label).toLowerCase()
  )

  const otherGroup = groups.find(isOtherVirtualGroup)
  const reimbursementsGroup = groups.find(isReimbursementsVirtualGroup)

  if (otherGroup) {
    sortedGroups.push(translateGroup(otherGroup, translate))
  }

  if (reimbursementsGroup) {
    sortedGroups.push(translateGroup(reimbursementsGroup, translate))
  }

  return sortedGroups
}
