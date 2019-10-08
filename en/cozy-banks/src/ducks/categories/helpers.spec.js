jest.mock('cozy-flags')

import { isAwaitingCategorization, getTransactionsByCategory } from './helpers'

describe('isAwaitingCategorization', () => {
  it('should return true if the transaction is awaiting cozy categorization', () => {
    const transaction = { _id: 't1', automaticCategoryId: '400110' }
    expect(isAwaitingCategorization(transaction)).toBe(true)
  })

  it('should return false if the transaction have a cozy categorization', () => {
    const transaction = { _id: 't1', cozyCategoryId: '400110' }
    expect(isAwaitingCategorization(transaction)).toBe(false)
  })
})

describe('getTransactionsByCategory', () => {
  const byCategory = getTransactionsByCategory([
    {
      manualCategoryId: '200110',
      automaticCategoryId: '200120',
      localCategoryId: '200130'
    }
  ])
  expect(Object.keys(byCategory).length).toBe(13)
  expect(byCategory.activities.id).toBe('400700')
  expect(byCategory.incomeCat.id).toBe('200100')
  expect(byCategory.incomeCat.transactions.length).toBe(1)
  expect(byCategory.incomeCat.subcategories['200110'].id).toBe('200110')
  expect(byCategory.incomeCat.subcategories['200110'].name).toBe(
    'activityIncome'
  )
})
