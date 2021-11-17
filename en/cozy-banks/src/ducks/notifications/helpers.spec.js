import {
  isTransactionAmountGreaterThan,
  getReimbursementBillId,
  getReimbursementBillIds,
  getScheduleDate,
  prepareTransactions,
  treatedByFormat
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

describe('getScheduleDate', () => {
  it('should return a date the next day at 6AM', () => {
    const date = new Date('2021-11-01T23:30:00')

    expect(getScheduleDate(date).getDay()).toBe(2)
    expect(getScheduleDate(date).getHours()).toBe(6)
  })

  it('should return the same date at 6AM', () => {
    const date = new Date('2021-11-02T01:30:00')

    expect(getScheduleDate(date).getDay()).toBe(2)
    expect(getScheduleDate(date).getHours()).toBe(6)
  })

  it('should return the same date and same hours', () => {
    const date = new Date('2021-11-01T22:30:00')

    expect(getScheduleDate(date).getDay()).toBe(1)
    expect(getScheduleDate(date).getHours()).toBe(22)
    expect(getScheduleDate(date).getMinutes()).toBe(30)

    const date2 = new Date('2021-11-02T06:30:00')

    expect(getScheduleDate(date2).getDay()).toBe(2)
    expect(getScheduleDate(date2).getHours()).toBe(6)
    expect(getScheduleDate(date2).getMinutes()).toBe(30)
  })
})

describe('prepareTransactions', () => {
  it('should prepare transactions for the template', function() {
    const transactions = [
      { account: 'isa1', label: '4', date: '2012-08-10' },
      { account: 'isa1', label: '3', date: '2012-08-08' },
      { account: 'isa1', label: '2', date: '2012-08-08' },
      { account: 'isa2', label: '7', date: '2012-08-06' },
      { account: 'isa2', label: '6', date: '2012-08-17' },
      { account: 'isa1', label: '5', date: '2012-08-14' },
      { account: 'isa1', label: '1', date: '2012-08-02' }
    ]

    const prepared = prepareTransactions(transactions)

    // date -> [key, values]
    expect(prepared.isa1[0][0]).toBe('2012-08-14')
    expect(prepared.isa2[0][0]).toBe('2012-08-17')
    expect(prepared.isa1[0][1][0].label).toBe('5')
    expect(prepared.isa1[1][1][0].label).toBe('4')
    expect(prepared.isa1[2][1][0].label).toBe('3')
    expect(prepared.isa1[2][1][1].label).toBe('2')
    expect(prepared.isa1[3][1][0].label).toBe('1')
  })
})

describe('treatedByFormat', () => {
  it('should format correctly when there is one reimbursement', () => {
    const billsById = {
      1: { vendor: 'Vendor 1' }
    }

    const reimbursements = [{ billId: 'io.cozy.bills:1' }]

    expect(treatedByFormat(reimbursements, billsById)).toBe('Vendor 1')
  })

  it('should format correctly when there is multiple reimbursements', () => {
    const billsById = {
      1: { vendor: 'Vendor 1' },
      2: { vendor: 'Vendor 2' }
    }

    const reimbursements = [
      { billId: 'io.cozy.bills:1' },
      { billId: 'io.cozy.bills:2' }
    ]

    expect(treatedByFormat(reimbursements, billsById)).toBe(
      'Vendor 1, Vendor 2'
    )
  })
})
