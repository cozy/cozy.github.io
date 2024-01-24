import {
  getIdentifiers,
  getOperationAmountFromBill,
  getOperationDateFromBill,
  getDateRangeFromBill,
  getAmountRangeFromBill,
  getTotalReimbursements,
  sortedOperations,
  getBillRegexp
} from './helpers'

const OK = 'ok'

describe('getterHelper', () => {
  test('getIdentifiers', () => {
    expect(getIdentifiers({ identifiers: OK })).toBe(OK)
  })

  describe('getOperationAmountFromBill', () => {
    const amount = 7.5
    const originalAmount = 25
    const bill1 = { amount, originalAmount }
    const bill2 = { amount }

    test('find debit amount', () => {
      expect(getOperationAmountFromBill(bill1)).toBe(-originalAmount)
      expect(getOperationAmountFromBill(bill2)).toBe(-amount)
    })
    test('find credit amount', () => {
      expect(getOperationAmountFromBill(bill1, { credit: true })).toBe(amount)
    })
  })

  describe('getOperationDateFromBill', () => {
    const date = '2018-01-08'
    const originalDate = '2018-01-03'
    const bill1 = { date, originalDate }
    const bill2 = { date }

    it('should find debit date', () => {
      expect(getOperationDateFromBill(bill1)).toEqual(new Date(originalDate))
      expect(getOperationDateFromBill(bill2)).toEqual(new Date(date))
    })
    it('should find credit date', () => {
      expect(getOperationDateFromBill(bill1, { credit: true })).toEqual(
        new Date(date)
      )
    })
  })

  describe('getDateRangeFromBill', () => {
    const dateLowerDelta = 1
    const dateUpperDelta = 1
    const date = '2018-01-08'
    const originalDate = '2018-01-03'
    const options = { dateLowerDelta, dateUpperDelta }
    const creditOptions = { ...options, credit: true }

    const matchingCriterias = {
      dateLowerDelta: 2,
      dateUpperDelta: 2
    }

    const bill1 = { date, originalDate }
    const bill2 = { ...bill1, matchingCriterias }

    it('should find debit date range', () => {
      const bill1Range = getDateRangeFromBill(bill1, options)
      expect(bill1Range.minDate).toEqual(new Date('2018-01-02'))
      expect(bill1Range.maxDate).toEqual(new Date('2018-01-04'))

      const bill2Range = getDateRangeFromBill(bill2, options)
      expect(bill2Range.minDate).toEqual(new Date('2018-01-01'))
      expect(bill2Range.maxDate).toEqual(new Date('2018-01-05'))
    })

    it('should find credit date range', () => {
      const bill1Range = getDateRangeFromBill(bill1, creditOptions)
      expect(bill1Range.minDate).toEqual(new Date('2018-01-07'))
      expect(bill1Range.maxDate).toEqual(new Date('2018-01-09'))

      const bill2Range = getDateRangeFromBill(bill2, creditOptions)
      expect(bill2Range.minDate).toEqual(new Date('2018-01-06'))
      expect(bill2Range.maxDate).toEqual(new Date('2018-01-10'))
    })
  })

  describe('getAmountRangeFromBill', () => {
    const amountLowerDelta = 1
    const amountUpperDelta = 1
    const options = { amountLowerDelta, amountUpperDelta }
    const creditOptions = { ...options, credit: true }
    const amount = 7.5
    const originalAmount = 25

    const matchingCriterias = {
      amountLowerDelta: 2,
      amountUpperDelta: 2
    }

    const bill1 = { amount }
    const bill2 = { amount, originalAmount }
    const bill3 = { amount, matchingCriterias }
    const bill4 = { ...bill2, matchingCriterias }

    it('should find debit amount range (negative)', () => {
      const bill1Range = getAmountRangeFromBill(bill1, options)
      expect(bill1Range.minAmount).toEqual(-8.5)
      expect(bill1Range.maxAmount).toEqual(-6.5)

      const bill3Range = getAmountRangeFromBill(bill3, options)
      expect(bill3Range.minAmount).toEqual(-9.5)
      expect(bill3Range.maxAmount).toEqual(-5.5)
    })

    it('should find debit amount range of bill with originalAmount (negative)', () => {
      const bill2Range = getAmountRangeFromBill(bill2, options)
      expect(bill2Range.minAmount).toEqual(-26)
      expect(bill2Range.maxAmount).toEqual(-24)

      const bill4Range = getAmountRangeFromBill(bill4, options)
      expect(bill4Range.minAmount).toEqual(-27)
      expect(bill4Range.maxAmount).toEqual(-23)
    })

    it('sould find credit amount range (positive)', () => {
      const bill1Range = getAmountRangeFromBill(bill1, creditOptions)
      expect(bill1Range.minAmount).toEqual(6.5)
      expect(bill1Range.maxAmount).toEqual(8.5)

      const bill3Range = getAmountRangeFromBill(bill3, creditOptions)
      expect(bill3Range.minAmount).toEqual(5.5)
      expect(bill3Range.maxAmount).toEqual(9.5)
    })

    it('should find credit amount range of bill with originalAmount (positive)', () => {
      const bill2Range = getAmountRangeFromBill(bill2, creditOptions)
      expect(bill2Range.minAmount).toEqual(6.5)
      expect(bill2Range.maxAmount).toEqual(8.5)

      const bill4Range = getAmountRangeFromBill(bill4, creditOptions)
      expect(bill4Range.minAmount).toEqual(5.5)
      expect(bill4Range.maxAmount).toEqual(9.5)
    })
  })

  describe('getTotalReimbursements', () => {
    it('should return 0 when no reimbursements field', () => {
      const op = {}
      expect(getTotalReimbursements(op)).toEqual(0)
    })

    it('should return the total amount of reimbursements field', () => {
      const amount1 = 3
      const amount2 = 2
      const op = { reimbursements: [{ amount: amount1 }, { amount: amount2 }] }
      expect(getTotalReimbursements(op)).toEqual(5) // amount1 + amount2
    })
  })

  describe('sortedOperations', () => {
    const bill = { date: new Date(2017, 0, 17), amount: 10 }

    test('op.date === bill.date && op.amount === bill.amount', () => {
      const operations = [
        { id: 1, date: new Date(2017, 0, 16), amount: -10 },
        { id: 3, date: new Date(2017, 0, 17), amount: -10 },
        { id: 2, date: new Date(2017, 0, 17), amount: -11 }
      ]
      expect(sortedOperations(bill, operations)[0]).toEqual(operations[1])
    })

    test('op.date === bill.date, so only amount is important', () => {
      const operations = [
        { id: 1, date: new Date(2017, 0, 17), amount: -8 },
        { id: 2, date: new Date(2017, 0, 17), amount: -9 },
        { id: 3, date: new Date(2017, 0, 17), amount: -12 }
      ]
      expect(sortedOperations(bill, operations)[0]).toEqual(operations[1])
    })

    test('op.amount === bill.amount, so only date is important', () => {
      const operations = [
        { id: 1, date: new Date(2017, 0, 15), amount: -10 },
        { id: 2, date: new Date(2017, 0, 18), amount: -10 },
        { id: 3, date: new Date(2017, 0, 19), amount: -10 }
      ]
      expect(sortedOperations(bill, operations)[0]).toEqual(operations[1])
    })

    test('amount & date are different', () => {
      const operations = [
        { id: 1, date: new Date(2017, 0, 16), amount: -12 },
        { id: 2, date: new Date(2017, 0, 18), amount: -11 },
        { id: 3, date: new Date(2017, 0, 19), amount: -13 }
      ]
      expect(sortedOperations(bill, operations)[0]).toEqual(operations[1])
    })
  })

  describe('getBillRegexp', () => {
    it('should return the regexp from matching criterias if it exists', () => {
      const bill = {
        matchingCriterias: { labelRegex: '\\bCOZY CLOUD\\b' },
        vendor: 'Payfit'
      }

      const regexp = getBillRegexp(bill)

      expect(regexp.toString()).toBe('/\\bCOZY CLOUD\\b/i')
    })

    it('should return the brand regexp if it exists', () => {
      const brands = [{ regexp: '\\bPAYFIT\\b' }]
      const bill = { vendor: 'Payfit' }
      const regexp = getBillRegexp(bill, brands)

      expect(regexp.toString()).toBe('/\\bPayfit\\b/i')
    })

    it("should build a regexp from the bill's vendor if nothing else exists", () => {
      const brands = []
      const bill = { vendor: 'Payfit' }
      const regexp = getBillRegexp(bill, brands)

      expect(regexp.toString()).toBe('/\\bPayfit\\b/i')
    })

    it('should return null if the bill has no labelRegex and no vendor', () => {
      const bill = {}
      const regexp = getBillRegexp(bill)

      expect(regexp).toBe(null)
    })
  })
})
