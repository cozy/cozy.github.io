import {
  isTransactionAmountGreaterThan,
  getReimbursementBillId,
  getReimbursementBillIds,
  getScheduleDate,
  prepareTransactions,
  treatedByFormat,
  formatAmount,
  formatAmountWithSign
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
  it('should return a date the next day at 5AM', () => {
    const date = new Date('2021-11-01T22:30:00')

    expect(getScheduleDate(date).getDay()).toBe(2)
    expect(getScheduleDate(date).getHours()).toBe(5)
  })

  it('should return the same date at 5AM', () => {
    const date = new Date('2021-11-02T01:30:00')

    expect(getScheduleDate(date).getDay()).toBe(2)
    expect(getScheduleDate(date).getHours()).toBe(5)
  })

  it('should return the same date and same hours', () => {
    let date = new Date('2021-11-01T21:30:00')
    let scheduledDate = getScheduleDate(date)

    expect(date).toEqual(scheduledDate)

    date = new Date('2021-11-02T05:30:00')
    scheduledDate = getScheduleDate(date)

    expect(date).toEqual(scheduledDate)
  })

  it('should not mutate the initial date', () => {
    let date = new Date('2021-11-01T22:30:00')
    let scheduledDate = getScheduleDate(date)

    expect(date).not.toEqual(scheduledDate)

    date = new Date('2021-11-02T01:30:00')
    scheduledDate = getScheduleDate(date)

    expect(date).not.toEqual(scheduledDate)
  })
})

describe('prepareTransactions', () => {
  it('should prepare transactions for the template', function () {
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

describe('formatAmount', () => {
  it('should format amounts', () => {
    expect(formatAmount(0, false)).toBe('0')
    expect(formatAmount(0.001, false)).toBe('0')
    expect(formatAmount(0.999, false)).toBe('1')
    expect(formatAmount(123, false)).toBe('123')
    expect(formatAmount(123.4, false)).toBe('123,40')
    expect(formatAmount(123.45, false)).toBe('123,45')
    expect(formatAmount(123.456, false)).toBe('123,46')
    expect(formatAmount(-0, false)).toBe('0')
    expect(formatAmount(-0.001, false)).toBe('0')
    expect(formatAmount(-0.999, false)).toBe('-1')
    expect(formatAmount(-123, false)).toBe('-123')
    expect(formatAmount(-123.4, false)).toBe('-123,40')
    expect(formatAmount(-123.45, false)).toBe('-123,45')
    expect(formatAmount(-123.456, false)).toBe('-123,46')
    expect(formatAmount(1, true)).toBe('***,**')
    expect(formatAmount(123.456, true)).toBe('***,**')
    expect(formatAmount(-1, true)).toBe('***,**')
    expect(formatAmount(-123.456, true)).toBe('***,**')
  })
})

describe('formatAmountWithSign', () => {
  it('should format amounts with sign', () => {
    expect(formatAmountWithSign(0, false)).toBe('0')
    expect(formatAmountWithSign(0.001, false)).toBe('0')
    expect(formatAmountWithSign(0.999, false)).toBe('+1')
    expect(formatAmountWithSign(123, false)).toBe('+123')
    expect(formatAmountWithSign(123.4, false)).toBe('+123,40')
    expect(formatAmountWithSign(123.45, false)).toBe('+123,45')
    expect(formatAmountWithSign(123.456, false)).toBe('+123,46')
    expect(formatAmountWithSign(-0, false)).toBe('0')
    expect(formatAmountWithSign(-0.001, false)).toBe('0')
    expect(formatAmountWithSign(-0.999, false)).toBe('-1')
    expect(formatAmountWithSign(-123, false)).toBe('-123')
    expect(formatAmountWithSign(-123.4, false)).toBe('-123,40')
    expect(formatAmountWithSign(-123.45, false)).toBe('-123,45')
    expect(formatAmountWithSign(-123.456, false)).toBe('-123,46')
    expect(formatAmountWithSign(1, true)).toBe('***,**')
    expect(formatAmountWithSign(123.456, true)).toBe('***,**')
    expect(formatAmountWithSign(-1, true)).toBe('***,**')
    expect(formatAmountWithSign(-123.456, true)).toBe('***,**')
  })
})
