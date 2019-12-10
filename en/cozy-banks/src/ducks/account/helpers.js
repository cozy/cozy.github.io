import {
  get,
  sumBy,
  overEvery,
  flowRight as compose,
  set,
  uniqBy,
  flatten
} from 'lodash'
import {
  getDate,
  getReimbursedAmount as getTransactionReimbursedAmount,
  hasPendingReimbursement
} from 'ducks/transactions/helpers'
import { isHealthExpense } from 'ducks/categories/helpers'
import { differenceInCalendarDays, isThisYear } from 'date-fns'
import flag from 'cozy-flags'
import { BankAccount } from 'cozy-doctypes'
import { ACCOUNT_DOCTYPE, CONTACT_DOCTYPE } from 'doctypes'

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

export const getAccountLabel = account =>
  account ? account.shortLabel || account.label : ''

export const getAccountUpdateDateDistance = (account, from) => {
  const updateDate = BankAccount.getUpdatedAt(account)

  if (!updateDate || !from) {
    return null
  }

  return differenceInCalendarDays(from, updateDate)
}

export const distanceInWords = distance => {
  if (!Number.isFinite(distance)) {
    return 'Balance.updated_at.unknown'
  }

  if (distance === 0) {
    return 'Balance.updated_at.today'
  }

  if (distance === 1) {
    return 'Balance.updated_at.yesterday'
  }

  return 'Balance.updated_at.n_days_ago'
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

export const getAccountUpdatedAt = account => {
  if (flag('demo')) {
    return {
      translateKey: distanceInWords(0),
      params: { nbDays: 0 }
    }
  }
  const today = new Date()
  const updateDistance = getAccountUpdateDateDistance(account, today)
  const updateDistanceInWords = distanceInWords(updateDistance)

  return {
    translateKey: updateDistanceInWords,
    params: { nbDays: updateDistance }
  }
}

export const buildHealthReimbursementsVirtualAccount = transactions => {
  const healthExpensesFilter = overEvery(
    [
      isHealthExpense,
      compose(
        isThisYear,
        getDate
      ),
      flag('reimbursements.tag') && hasPendingReimbursement
    ].filter(Boolean)
  )

  const healthExpenses = transactions.filter(healthExpensesFilter)

  const balance = sumBy(healthExpenses, expense => {
    const reimbursedAmount = getTransactionReimbursedAmount(expense)
    return -expense.amount - reimbursedAmount
  })

  const account = {
    _id: 'health_reimbursements',
    _type: ACCOUNT_DOCTYPE,
    label: 'Data.virtualAccounts.healthReimbursements',
    balance,
    type: 'Reimbursements',
    currency: '€',
    virtual: true
  }

  return account
}

export const buildVirtualAccounts = transactions => {
  return [buildHealthReimbursementsVirtualAccount(transactions)]
}

export const isHealthReimbursementsAccount = account => {
  return account._id === 'health_reimbursements' && account.virtual
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

export const getBorrowedAmount = account => {
  return get(account, 'loan.usedAmount') || get(account, 'loan.totalAmount')
}

export const getRemainingAmount = account => {
  return Math.abs(account.balance)
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
  return get(account, 'owners.data', [])
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
