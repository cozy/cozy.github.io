import {
  isTransactionAmountGreaterThan,
  getReimbursementBillId,
  getReimbursementBillIds
} from './helpers'

describe('isTransactionAmountGreaterThan', () => {
  it('should return if amount is geater then transation amount', () => {
    expect(isTransactionAmountGreaterThan(100)({ amount: 200 })).toBe(true)
    expect(isTransactionAmountGreaterThan(100)({ amount: 50 })).toBe(false)
  })
  it('should return false when maxAmount is null or undefined', () => {
    expect(isTransactionAmountGreaterThan(undefined)({ amount: 50 })).toBe(
      false
    )
    expect(isTransactionAmountGreaterThan(null)({ amount: 50 })).toBe(false)
  })
})

describe('getReimbursementBillId', () => {
  it('should return the bill id', () => {
    const reimbursement = { billId: 'io.cozy.bills:1' }

    expect(getReimbursementBillId(reimbursement)).toBe('1')
  })
})

describe('getReimbursementBillIds', () => {
  it('should return the bill ids', () => {
    const transactions = [
      { reimbursements: [{ billId: 'io.cozy.bills:1' }] },
      { reimbursements: [{ billId: 'io.cozy.bills:2' }] },
      { reimbursements: [{ billId: 'io.cozy.bills:3' }] },
      {} // it should not fail if a transaction has no reimbursements
    ]

    expect(getReimbursementBillIds(transactions)).toEqual(['1', '2', '3'])
  })
})
