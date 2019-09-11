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
 * Returns a function that returns the translated label of a group
 *
 * @param {Object} group - Group
 * @param {Function} translate - Translation function
 * @returns {Object} Translated label
 */
export const mkGetTranslatedLabel = translate => group =>
  group.virtual
    ? translate(`Data.accountTypes.${group.label}`, { _: 'other' })
    : group.label

const isOtherVirtualGroup = group => group.virtual && group.label === 'Other'

export const isReimbursementsVirtualGroup = group =>
  group.virtual && group._id === 'Reimbursements'

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
  virtualReimbursements: 2
}

/**
 * Translate groups labels then sort them on their translated label. But always put "others accounts" last
 * @param {Object[]} groups - The groups to sort
 * @param {Function} translate - The translation function
 * @returns {Object[]} The sorted wrapped groups ({ category, label, group })
 */
export const translateAndSortGroups = (groups, translate) => {
  const getTranslatedLabel = mkGetTranslatedLabel(translate)

  // Wrap groups to add necessary information for sorting
  const wrappedGroups = groups.map(group => ({
    group,
    category: getCategory(group),
    label: getTranslatedLabel(group)
  }))

  return sortBy(wrappedGroups, ({ label, category }) => [
    groupSortingPriorities[category],
    deburr(label).toLowerCase()
  ])
}
