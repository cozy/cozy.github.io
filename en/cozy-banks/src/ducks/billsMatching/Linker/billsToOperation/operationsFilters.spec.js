import {
  filterByBrand,
  filterByDates,
  filterByAmounts,
  filterByCategory,
  filterByReimbursements,
  operationsFilters
} from './operationsFilters'
import brands from 'ducks/brandDictionary/brands'

describe('operations filters', () => {
  describe('filtering by brand', () => {
    it('should use the regexp from the dictionnary if the brand exists in it', () => {
      const bill = { vendor: 'Trainline' }
      const fByBrand = filterByBrand(bill, brands)

      expect(fByBrand({ label: 'Trainline !!!' })).toBe(true)
      expect(fByBrand({ label: 'Yes Trainline' })).toBe(true)
      expect(fByBrand({ label: 'CapitainTrain' })).toBe(false)
    })

    it("should generate a regexp with the bill vendor if the brand doesn't exist in the dictionnary", () => {
      const bill = { vendor: 'Tartanpion' }
      const fByBrand = filterByBrand(bill, brands)

      expect(fByBrand({ label: 'Chez Tartanpion !!!' })).toBe(true)
      expect(fByBrand({ label: 'tartanpion 17/09' })).toBe(true)
      expect(fByBrand({ label: 'Rien à voir' })).toBe(false)
    })

    it('should use the regexp from the bill if it has one', () => {
      const bill = { matchingCriterias: { labelRegex: 'Bidule' } }
      const fByBrand = filterByBrand(bill, brands)

      expect(fByBrand({ label: 'Chez Bidule !!!' })).toBe(true)
      expect(fByBrand({ label: 'bidule 20/08' })).toBe(true)
      expect(fByBrand({ label: 'Ca match paaaas du tout' })).toBe(false)
    })

    it('should return false if the bill has no vendor and no regex', () => {
      const bill = {}
      const fByBrand = filterByBrand(bill, brands)

      expect(fByBrand({ label: 'Something' })).toBe(false)
    })
  })

  test('filtering by date period', () => {
    const rangeDates = {
      minDate: new Date(2018, 0, 16),
      maxDate: new Date(2018, 0, 18)
    }
    const fByDates = filterByDates(rangeDates)

    expect(fByDates({ date: new Date(2018, 0, 15) })).toBeFalsy()
    expect(fByDates({ date: new Date(2018, 0, 16) })).toBeTruthy()
    expect(fByDates({ date: new Date(2018, 0, 17) })).toBeTruthy()
    expect(fByDates({ date: new Date(2018, 0, 18) })).toBeTruthy()
    expect(fByDates({ date: new Date(2018, 0, 19) })).toBeFalsy()
  })

  describe('filtering by amount range', () => {
    it('should pass when amount is within range', () => {
      const rangeDates = {
        minAmount: 16,
        maxAmount: 18
      }
      const fByAmounts = filterByAmounts(rangeDates)

      expect(fByAmounts({ amount: 15 })).toBeFalsy()
      expect(fByAmounts({ amount: 16 })).toBeTruthy()
      expect(fByAmounts({ amount: 17 })).toBeTruthy()
      expect(fByAmounts({ amount: 18 })).toBeTruthy()
      expect(fByAmounts({ amount: 19 })).toBeFalsy()
    })
  })

  const HEALTH_EXPENSE_CAT = '400610'
  const HEALTH_INSURANCE_CAT = '400620'

  describe('filtering by category', () => {
    it('should only match bills with the right categoryId when the bill type is health_costs', () => {
      const fByCategory = filterByCategory({ type: 'health_costs' })
      expect(fByCategory({ manualCategoryId: HEALTH_EXPENSE_CAT })).toBeTruthy()

      expect(
        fByCategory({
          cozyCategoryId: HEALTH_EXPENSE_CAT,
          cozyCategoryProba: 0.5
        })
      ).toBeTruthy()

      expect(
        fByCategory({
          automaticCategoryId: HEALTH_EXPENSE_CAT,
          cozyCategoryId: '0',
          cozyCategoryProba: 0
        })
      ).toBeTruthy()

      expect(fByCategory({ manualCategoryId: '0' })).toBeFalsy()
      expect(fByCategory({ automaticCategoryId: '0' })).toBeFalsy()
    })

    it('should match uncategorized only if specified in options', () => {
      const fByCategory = filterByCategory(
        { vendor: 'Ameli' },
        { allowUncategorized: true }
      )
      expect(fByCategory({ manualCategoryId: '0' })).toBeTruthy()
      expect(fByCategory({ automaticCategoryId: '0' })).toBeTruthy()
      expect(fByCategory({})).toBeTruthy()
    })

    it('should not match bills with categoryId that are not health insurance/expense', () => {
      const fByCategory = filterByCategory({ type: 'health_costs' })
      expect(fByCategory({ manualCategoryId: '400611' })).toBeFalsy()
      expect(fByCategory({ automaticCategoryId: '400611' })).toBeFalsy()
    })

    it('should match check debits against health expense category', () => {
      const fByCategory = filterByCategory({ type: 'health_costs' })
      expect(
        fByCategory({ manualCategoryId: HEALTH_INSURANCE_CAT, amount: -10 })
      ).toBeFalsy()
      expect(
        fByCategory({ manualCategoryId: HEALTH_EXPENSE_CAT, amount: -10 })
      ).toBeTruthy()
    })

    it('should match check credits against health insurance category and health expense category', () => {
      const fByCategory = filterByCategory({ type: 'health_costs' })
      expect(
        fByCategory({ manualCategoryId: HEALTH_INSURANCE_CAT, amount: 10 })
      ).toBeTruthy()
      expect(
        fByCategory({ manualCategoryId: HEALTH_EXPENSE_CAT, amount: 10 })
      ).toBeTruthy()
    })

    test('not health bill', () => {
      const fByCategory = filterByCategory({ vendor: 'SFR' })
      expect(fByCategory({ manualCategoryId: HEALTH_EXPENSE_CAT })).toBeFalsy()
      expect(fByCategory({ manualCategoryId: '0' })).toBeTruthy()
      expect(fByCategory({})).toBeTruthy()
      expect(fByCategory({ manualCategoryId: '400611' })).toBeTruthy()
    })
  })

  describe('filterByReimbursements', () => {
    const fReimbursements = filterByReimbursements({ amount: 10 })
    expect(
      fReimbursements({ reimbursements: [{ amount: 10 }], amount: -10 })
    ).toBe(false)
    expect(
      fReimbursements({
        reimbursements: [{ amount: 7 }, { amount: 3 }],
        amount: -10
      })
    ).toBe(false)
    expect(
      fReimbursements({
        reimbursements: [{ amount: 7 }, { amount: 3 }],
        amount: -20
      })
    ).toBe(true)
  })

  describe('operationsFilters', () => {
    const operations = [
      {
        amount: -20,
        label: 'Visite chez le médecin',
        _id: 'o1',
        date: new Date(2017, 11, 13),
        manualCategoryId: '400610'
      },
      {
        amount: 5,
        label: 'Remboursement CPAM',
        _id: 'o2',
        date: new Date(2017, 11, 15),
        manualCategoryId: '400610'
      },
      {
        amount: -120,
        label: 'Facture SFR',
        _id: 'o3',
        date: new Date(2017, 11, 8)
      },
      {
        amount: -30,
        label: 'Facture SFR',
        _id: 'o4',
        date: new Date(2017, 11, 7)
      },
      {
        amount: -80,
        label: "Matériel d'escalade",
        _id: 'o5',
        date: new Date(2017, 11, 7)
      },
      {
        amount: -5.5,
        label: 'Burrito',
        _id: 'o6',
        date: new Date(2017, 11, 5)
      },
      { amount: -2.6, label: 'Salade', _id: 'o7', date: new Date(2017, 11, 6) },
      {
        amount: 50,
        label: 'Remboursement CPAM',
        _id: 'o8',
        date: new Date(2017, 11, 15),
        manualCategoryId: '400610',
        reimbursements: [{ amount: 50 }]
      },
      {
        amount: -50,
        label: 'Visite chez le dentiste',
        _id: 'o9',
        manualCategoryId: '400610',
        date: new Date(2017, 11, 16),
        reimbursements: []
      },
      {
        amount: -7.5,
        label: 'Dafalgan',
        _id: 'o10',
        manualCategoryId: '400610',
        date: new Date(2017, 11, 16),
        reimbursements: []
      },
      {
        amount: 57.5,
        label: 'Remboursement CPAM',
        _id: 'o11',
        manualCategoryId: '400610',
        date: new Date(2017, 11, 16),
        reimbursements: []
      }
    ]

    const defaultOptions = {
      amountLowerDelta: 1,
      amountUpperDelta: 1,
      dateLowerDelta: 1,
      dateUpperDelta: 1
    }

    describe('health bill', () => {
      const bill = {
        amount: 5,
        originalAmount: 20,
        type: 'health_costs',
        originalDate: new Date(2017, 11, 13),
        date: new Date(2017, 11, 15),
        isRefund: true,
        vendor: 'Ameli'
      }

      const debitOptions = { ...defaultOptions, identifiers: ['CPAM'] }
      const creditOptions = { ...debitOptions, credit: true }

      test('get debit operation', () => {
        expect(
          operationsFilters(bill, operations, debitOptions, brands)
        ).toEqual([operations[0]])
      })

      test('get credit operation', () => {
        expect(
          operationsFilters(bill, operations, creditOptions, brands)
        ).toEqual([operations[1]])
      })
    })

    describe('not health bill', () => {
      const bill = {
        amount: 30,
        date: new Date(2017, 11, 8),
        vendor: 'SFR'
      }

      const debitOptions = { ...defaultOptions, identifiers: ['SFR'] }
      const creditOptions = { ...debitOptions, credit: true }

      test('get debit operation', () => {
        expect(
          operationsFilters(bill, operations, debitOptions, brands)
        ).toEqual([operations[3]])
      })

      test('get credit operation', () => {
        expect(
          operationsFilters(bill, operations, creditOptions, brands)
        ).toEqual([])
      })
    })

    describe('group amount', () => {
      const bill = {
        amount: 50,
        groupAmount: 57.5,
        date: new Date(2017, 11, 16),
        vendor: 'Ameli',
        type: 'health_costs',
        isRefund: true
      }
      const debitOptions = { ...defaultOptions }
      const creditOptions = { ...debitOptions, credit: true }
      it('get debit operation', () => {
        expect(
          operationsFilters(bill, operations, debitOptions, brands)
        ).toEqual([operations[8]])
      })

      it('get credit operation', () => {
        expect(
          operationsFilters(bill, operations, creditOptions, brands)
        ).toEqual([operations[10]])
      })
    })
  })
})
