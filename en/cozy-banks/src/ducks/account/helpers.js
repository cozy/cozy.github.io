import flag from 'cozy-flags'
import { BankAccount } from 'cozy-doctypes'
import overSome from 'lodash/overSome'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import set from 'lodash/set'
import compose from 'lodash/flowRight'
import overEvery from 'lodash/overEvery'
import sumBy from 'lodash/sumBy'
import get from 'lodash/get'

import { models } from 'cozy-client'
import {
  getDate,
  getReimbursedAmount as getTransactionReimbursedAmount,
  hasPendingReimbursement,
  isExpense
} from 'ducks/transactions/helpers'
import {
  isHealthExpense,
  isProfessionalExpense,
  getCategoryIdFromName
} from 'ducks/categories/helpers'
import { differenceInCalendarDays, isAfter, subMonths } from 'date-fns'
import { ACCOUNT_DOCTYPE, CONTACT_DOCTYPE } from 'doctypes'

const {
  triggers: { triggerStates }
} = models

const PARTS_TO_DELETE = ['(sans Secure Key)']

export const getAccountInstitutionLabel = account => {
  if (!account) {
    return account
  }
  const label = PARTS_TO_DELETE.reduce(
    (label, partToDelete) => label.replace(partToDelete, ''),
    account.institutionLabel || ''
  )

  return label
}

export const getAccountLabel = (account, t) => {
  if (account == null) {
    return ''
  }
  const accountLabel = account.shortLabel || account.label
  return account.virtual ? t(accountLabel) : accountLabel
}

export const distanceInWords = distance => {
  if (!Number.isFinite(distance)) {
    return 'Balance.updated-at.unknown'
  }

  if (distance === 0) {
    return 'Balance.updated-at.today'
  }

  if (distance === 1) {
    return 'Balance.updated-at.yesterday'
  }

  return 'Balance.updated-at.n-days-ago'
}

export const accountTypesWithTranslation = [
  'Business',
  'Checkings',
  'CreditCard',
  'Joint',
  'Loan',
  'LongTermSavings',
  'Other',
  'Reimbursements',
  'Savings'
]

const accountTypesMap = {
  Article83: 'LongTermSavings',
  Asset: 'Business',
  Bank: 'Checkings',
  Capitalisation: 'Business',
  Cash: 'Checkings',
  ConsumerCredit: 'Loan',
  'Credit card': 'CreditCard',
  Deposit: 'Checkings',
  Liability: 'Business',
  LifeInsurance: 'LongTermSavings',
  Madelin: 'LongTermSavings',
  Market: 'LongTermSavings',
  Mortgage: 'LongTermSavings',
  None: 'Other',
  PEA: 'LongTermSavings',
  PEE: 'LongTermSavings',
  Perco: 'LongTermSavings',
  Perp: 'LongTermSavings',
  RevolvingCredit: 'Loan',
  RSP: 'LongTermSavings',
  Unkown: 'Other'
}

export const getAccountType = account => {
  const mappedType = accountTypesMap[account.type] || account.type || 'Other'
  const type = accountTypesWithTranslation.includes(mappedType)
    ? mappedType
    : 'Other'

  return type
}

export const getAccountInstitutionSlug = account =>
  get(account, 'cozyMetadata.createdByApp')

export const getAccountBalance = account => {
  if (account.type === 'CreditCard' && account.comingBalance) {
    return account.comingBalance
  }

  return account.balance
}

export const getAccountUpdatedAt = (account, jobTrigger) => {
  if (flag('demo')) {
    return {
      translateKey: distanceInWords(0),
      params: { nbDays: 0 }
    }
  }
  const today = new Date()
  const updatedAtAccount = BankAccount.getUpdatedAt(account)

  const updatedAtTrigger = triggerStates.getLastSuccess(jobTrigger)
  const updateDate = updatedAtTrigger || updatedAtAccount
  const updateDistance = updateDate
    ? differenceInCalendarDays(today, updateDate)
    : null

  const updateDistanceInWords = distanceInWords(updateDistance)
  return {
    translateKey: updateDistanceInWords,
    params: { nbDays: updateDistance }
  }
}

const isWithin6Months = () => {
  const SIX_MONTHS_AGO = subMonths(new Date(), 6)
  return date => isAfter(date, SIX_MONTHS_AGO)
}

/**
 * Generate a reimbursements virtual account builder
 *
 * @param {Object} specs
 * @param {Function} specs.filter - A function to filter transactions that fits in the virtual account
 * @param {String} specs.id - The id of the generated virtual account
 * @param {String} specs.translationKey - The translationKey that will be used to show the name of the virtual account
 * @param {String} [specs.categoryId] - The category id of the transactions that matches the virtual account if there is any
 *
 * @returns {Function} The builder
 */
const buildReimbursementsVirtualAccount = specs => transactions => {
  const combinedFilter = overEvery(
    [
      specs.filter,
      compose(isWithin6Months(), getDate),
      hasPendingReimbursement
    ].filter(Boolean)
  )
  const filteredTransactions = transactions.filter(combinedFilter)

  const balance = sumBy(filteredTransactions, expense => {
    const reimbursedAmount = getTransactionReimbursedAmount(expense)
    return -expense.amount - reimbursedAmount
  })

  const account = {
    _id: specs.id,
    _type: ACCOUNT_DOCTYPE,
    id: specs.id,
    label: `Data.virtualAccounts.${specs.translationKey}`,
    balance,
    type: 'Reimbursements',
    categoryId: specs.categoryId,
    currency: '€',
    virtual: true
  }

  return account
}

const healthExpensesCategoryId = getCategoryIdFromName('healthExpenses')
const professionalExpensesCategoryId = getCategoryIdFromName(
  'professionalExpenses'
)

export const reimbursementsVirtualAccountsSpecs = {
  [healthExpensesCategoryId]: {
    id: 'health_reimbursements',
    translationKey: 'healthReimbursements',
    categoryId: healthExpensesCategoryId,
    filter: isHealthExpense
  },
  [professionalExpensesCategoryId]: {
    id: 'professional_reimbursements',
    translationKey: 'professionalReimbursements',
    categoryId: professionalExpensesCategoryId,
    filter: isProfessionalExpense
  }
}

export const buildHealthReimbursementsVirtualAccount =
  buildReimbursementsVirtualAccount(
    reimbursementsVirtualAccountsSpecs[healthExpensesCategoryId]
  )

export const buildProfessionalReimbursementsVirtualAccount =
  buildReimbursementsVirtualAccount(
    reimbursementsVirtualAccountsSpecs[professionalExpensesCategoryId]
  )

const isSpecificReimbursement = overSome(
  Object.values(reimbursementsVirtualAccountsSpecs).map(spec => spec.filter)
)

export const othersFilter = transaction => {
  return !isSpecificReimbursement(transaction) && isExpense(transaction)
}

export const buildOthersReimbursementsVirtualAccount =
  buildReimbursementsVirtualAccount({
    id: 'others_reimbursements',
    translationKey: 'othersReimbursements',
    filter: othersFilter
  })

export const buildVirtualAccounts = transactions => {
  return [
    buildHealthReimbursementsVirtualAccount(transactions),
    buildProfessionalReimbursementsVirtualAccount(transactions),
    buildOthersReimbursementsVirtualAccount(transactions)
  ].filter(Boolean)
}

export const isReimbursementsAccount = account => {
  return account.type === 'Reimbursements'
}

export const isHealthReimbursementsAccount = account => {
  return account._id === 'health_reimbursements' && account.virtual
}

export const getBorrowedAmount = account => {
  return get(account, 'loan.usedAmount') || get(account, 'loan.totalAmount')
}

export const getRemainingAmount = account => {
  return Math.abs(account.balance)
}

export const getReimbursedAmount = account => {
  const borrowedAmount = getBorrowedAmount(account)
  const remainingAmount = getRemainingAmount(account)

  return borrowedAmount - remainingAmount
}

export const getReimbursedPercentage = account => {
  const reimbursedAmount = getReimbursedAmount(account)
  const borrowedAmount = getBorrowedAmount(account)
  const percentage = (reimbursedAmount / borrowedAmount) * 100

  return percentage
}

export const addOwnerToAccount = (account, owner) => {
  const currentOwners = get(account, 'relationships.owners.data', [])
  const newOwners = uniqBy(
    [...currentOwners, { _id: owner._id, _type: CONTACT_DOCTYPE }],
    o => o._id
  )

  set(account, 'relationships.owners.data', newOwners)

  return account
}

export const getAccountOwners = account => {
  return get(account, 'owners.data', []).filter(Boolean)
}

export const getUniqueOwners = accounts => {
  const allOwners = flatten(accounts.map(getAccountOwners))
  const uniqOwners = uniqBy(allOwners, owner => owner._id)

  return uniqOwners
}

export const isCreditCardAccount = account =>
  getAccountType(account) === 'CreditCard'
export const isCheckingsAccount = account =>
  getAccountType(account) === 'Checkings'
