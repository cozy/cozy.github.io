import { get, sumBy, overEvery, flowRight as compose } from 'lodash'
import {
  getDate,
  getReimbursedAmount,
  hasPendingReimbursement
} from 'ducks/transactions/helpers'
import { isHealthExpense } from 'ducks/categories/helpers'
import { differenceInCalendarDays, isThisYear } from 'date-fns'
import flag from 'cozy-flags'
import { BankAccount } from 'cozy-doctypes'
import { ACCOUNT_DOCTYPE } from 'doctypes'

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

export const getAccountType = account => {
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
      flag('reimbursement-tag') && hasPendingReimbursement
    ].filter(Boolean)
  )

  const healthExpenses = transactions.filter(healthExpensesFilter)

  const balance = sumBy(healthExpenses, expense => {
    const reimbursedAmount = getReimbursedAmount(expense)
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
