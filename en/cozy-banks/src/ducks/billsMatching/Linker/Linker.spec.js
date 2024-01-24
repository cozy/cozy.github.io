jest.mock('cozy-konnector-libs')

import Linker from './Linker'
import { cozyClient } from 'cozy-konnector-libs'
import { Document } from 'cozy-doctypes'
import brands from 'ducks/brandDictionary/brands'

let linker

Document.registerClient(cozyClient)

beforeEach(function () {
  // We mock defineIndex/query so that fetchOperations returns the right operations
  const INDEX = 'index'
  cozyClient.data.defineIndex.mockReturnValue(Promise.resolve(INDEX))

  linker = new Linker(cozyClient)
  linker.updateAttributes = jest.fn().mockReturnValue(Promise.resolve())
})

describe('linker', () => {
  const bill = { amount: 110, _id: 'b1' }

  describe('removeBillsFromOperations', () => {
    test('operations without bills and no bills', async () => {
      const operations = [{ _id: 1 }, { _id: 2 }]

      await linker.removeBillsFromOperations([], operations)
      expect(linker.updateAttributes).not.toBeCalled()
    })

    test('operations without bills and bills', async () => {
      const operations = [{ _id: 1 }, { _id: 2 }]
      const bills = [bill]

      await linker.removeBillsFromOperations(bills, operations)
      expect(linker.toUpdate.length).toEqual(0)
      expect(linker.updateAttributes).not.toBeCalled()
    })

    test('operations with bills and matching bill', async () => {
      const operations = [{ _id: 1, bills: ['io.cozy.bills:b1'] }, { _id: 2 }]
      const bills = [bill]

      await linker.removeBillsFromOperations(bills, operations)
      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operations[0],
        {
          bills: []
        }
      )
    })
    test('operations with bills and matching bill and remaining bills', async () => {
      const operations = [
        {
          _id: 1,
          bills: ['io.cozy.bills:b1', 'io.cozy.bills:b2', 'io.cozy.bills:b3']
        },
        { _id: 2 }
      ]
      const bills = [bill]

      await linker.removeBillsFromOperations(bills, operations)
      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operations[0],
        {
          bills: ['io.cozy.bills:b2', 'io.cozy.bills:b3']
        }
      )
    })
    test('bill id accross multiple operations', async () => {
      linker.updateAttributes.mockReset()
      const operations = [
        {
          _id: 1,
          bills: ['io.cozy.bills:b1', 'io.cozy.bills:b2', 'io.cozy.bills:b3']
        },
        {
          _id: 2,
          bills: ['io.cozy.bills:b3', 'io.cozy.bills:b2', 'io.cozy.bills:b1']
        }
      ]
      const bills = [
        { amount: 110, _id: 'b1' },
        { amount: 11, _id: 'b10' }
      ]

      await linker.removeBillsFromOperations(bills, operations)
      expect(linker.updateAttributes.mock.calls).toEqual([
        [
          'io.cozy.bank.operations',
          operations[0],
          {
            bills: ['io.cozy.bills:b2', 'io.cozy.bills:b3']
          }
        ],
        [
          'io.cozy.bank.operations',
          operations[1],
          {
            bills: ['io.cozy.bills:b3', 'io.cozy.bills:b2']
          }
        ]
      ])
    })
    test('bill with original', async () => {
      const operations = [
        {
          _id: 1,
          bills: ['io.cozy.bills:b1']
        }
      ]
      const bills = [{ ...bill, original: 'b2' }]

      await linker.removeBillsFromOperations(bills, operations)
      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operations[0],
        {
          bills: ['io.cozy.bills:b2']
        }
      )
    })
    test('2 bills with original', async () => {
      const operations = [
        {
          _id: 3,
          bills: ['io.cozy.bills:b1', 'io.cozy.bills:a1']
        }
      ]
      const bills = [
        { ...bill, original: 'b2' },
        { amount: 110, _id: 'a1', original: 'a2' }
      ]

      await linker.removeBillsFromOperations(bills, operations)
      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operations[0],
        {
          bills: ['io.cozy.bills:b2', 'io.cozy.bills:a2']
        }
      )
    })
    test('bill with original, and original present', async () => {
      const operations = [
        {
          _id: 2,
          bills: ['io.cozy.bills:b1', 'io.cozy.bills:b2']
        }
      ]
      const bills = [
        { ...bill, original: 'b2' },
        { amount: 110, _id: 'a1', original: 'a2' }
      ]

      await linker.removeBillsFromOperations(bills, operations)
      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operations[0],
        {
          bills: ['io.cozy.bills:b2']
        }
      )
    })
  })

  describe('getBillsSum', () => {
    it('should return the right sum', async () => {
      const operation = {
        bills: ['io.cozy.bills:b1', 'io.cozy.bills:b2']
      }

      const b1 = { amount: 10 }
      const b2 = { amount: 20 }

      cozyClient.fetchJSON.mockReturnValueOnce({
        rows: [{ doc: b1 }, { doc: b2 }]
      })

      const sum = await linker.getBillsSum(operation)

      expect(sum).toBe(30)
    })
  })

  describe('isBillAmountOverflowingOperationAmount', () => {
    test('return false if the bills sum does not overflow the operation amount', async () => {
      const operation = { amount: -20 }
      linker.getBillsSum = jest.fn().mockReturnValue(0)

      const bill = { amount: 10 }

      const result = await linker.isBillAmountOverflowingOperationAmount(
        bill,
        operation
      )

      expect(result).toBe(false)
    })

    test('return true if the bills sum overflows the operation amount', async () => {
      const operation = { amount: -20 }
      linker.getBillsSum = jest.fn().mockReturnValue(15)

      const bill = { amount: 10 }

      const result = await linker.isBillAmountOverflowingOperationAmount(
        bill,
        operation
      )

      expect(result).toBe(true)
    })
  })

  describe('addBillToOperation', () => {
    beforeEach(() => {
      linker.isBillAmountOverflowingOperationAmount = jest
        .fn()
        .mockReturnValue(false)
    })

    test('operation without bills', async () => {
      const operation = { _id: 123456 }

      await linker.addBillToOperation(bill, operation)

      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operation,
        {
          bills: ['io.cozy.bills:b1']
        }
      )
    })

    test('operation with bills', async () => {
      const operation = { _id: 12345, bills: ['bill1'] }

      await linker.addBillToOperation(bill, operation)

      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operation,
        {
          bills: ['bill1', 'io.cozy.bills:b1']
        }
      )
    })

    test('operation have already this bill', () => {
      const operation = { _id: 12345, bills: ['io.cozy.bills:b1'] }

      linker.addBillToOperation(bill, operation)

      expect(cozyClient.data.updateAttributes.mock.calls.length).toBe(0)
    })
  })

  describe('addReimbursementToOperation', () => {
    test('operation without reimbursements', () => {
      const operation = { _id: 123456 }

      linker.addReimbursementToOperation(bill, operation, operation)

      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operation,
        {
          reimbursements: [
            {
              amount: 110,
              billId: 'io.cozy.bills:b1',
              operationId: 123456
            }
          ]
        }
      )
    })

    test('operation with reimbursements', () => {
      const operation = { _id: 123456, reimbursements: ['test'] }

      linker.addReimbursementToOperation(bill, operation, operation)

      expect(linker.updateAttributes).lastCalledWith(
        'io.cozy.bank.operations',
        operation,
        {
          reimbursements: [
            'test',
            {
              amount: 110,
              billId: 'io.cozy.bills:b1',
              operationId: 123456
            }
          ]
        }
      )
    })

    test('operation have already the reimbursement', () => {
      const operation = {
        _id: 123456,
        reimbursements: [
          {
            amount: 110,
            billId: 'io.cozy.bills:b1',
            operationId: 123456
          }
        ]
      }

      linker.addReimbursementToOperation(bill, operation, operation)

      expect(cozyClient.data.updateAttributes.mock.calls.length).toBe(0)
    })
  })

  describe('linkBillsToOperations', () => {
    beforeEach(() => {
      linker.isBillAmountOverflowingOperationAmount = jest
        .fn()
        .mockReturnValue(false)
    })

    const testCases = require('../../../../test/fixtures/matching-service/cases')

    for (const testCase of testCases) {
      const fn = testCase.focus ? fit : it
      fn(testCase.description, async () => {
        const { bills, operations, expectedResult } = testCase
        const result = await linker.linkBillsToOperations(
          bills,
          operations,
          undefined,
          brands
        )

        Object.keys(expectedResult).forEach(billId => {
          const expected = expectedResult[billId]
          const real = result[billId] || {}
          for (let attr of ['debitOperation', 'creditOperation']) {
            const exp = expect(real[attr] && real[attr]._id)
            if (expected[attr] === null) {
              exp.not.toBeDefined()
            } else {
              exp.toBe(expected[attr])
            }
          }
        })
      })
    }

    it('should not link twice', async () => {
      let operations
      function updateOperation(doctype, needleOp, attributes) {
        const operation = operations.find(
          operation => operation._id === needleOp._id
        )
        Object.assign(operation, attributes)
        return Promise.resolve(operation)
      }
      linker.updateAttributes.mockImplementation(updateOperation)

      const bills = [
        {
          _id: 'b1',
          amount: 5,
          originalAmount: 20,
          originalDate: '2017-12-13T00:00:00.000Z',
          date: '2017-12-15T00:00:00.000Z',
          isRefund: true,
          vendor: 'Ameli',
          type: 'health_costs'
        }
      ]

      operations = [
        {
          _id: 'medecin',
          date: '2017-12-13T12:00:00.000Z',
          label: 'Visite chez le médecin',
          amount: -20,
          manualCategoryId: '400610'
        },
        {
          _id: 'cpam',
          date: '2017-12-15T12:00:00.000Z',
          label: 'Remboursement CPAM',
          amount: 5,
          manualCategoryId: '400610'
        }
      ]

      expect(operations[0].reimbursements).toBe(undefined)
      await linker.linkBillsToOperations(bills, operations, undefined, brands)
      expect(operations[0].reimbursements.length).toBe(1)
      await linker.linkBillsToOperations(bills, operations, undefined, brands)
      expect(operations[0].reimbursements.length).toBe(1)
    })
  })

  describe('linking with combinations', () => {
    describe('getUnlinkedBills', () => {
      it('returns the bills that are not linked', () => {
        const linkingResult = {
          b1: { bill: { _id: 'b1' }, debitOperation: {} },
          b2: { bill: { _id: 'b2' } }
        }

        const expected = expect.arrayContaining([linkingResult.b2.bill])

        expect(linker.getUnlinkedBills(linkingResult)).toEqual(expected)
      })

      it('returns an empty array if all bills are linked', () => {
        const linkingResult = {
          b1: { bill: { _id: 'b1' }, debitOperation: {} },
          b2: { bill: { _id: 'b2' }, debitOperation: {} }
        }

        expect(linker.getUnlinkedBills(linkingResult)).toHaveLength(0)
      })
    })

    describe('groupBills', () => {
      const bills = [
        {
          _id: 'b1',
          originalDate: new Date(2018, 2, 10),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b2',
          originalDate: new Date(2018, 2, 10),
          vendor: 'Numéricable',
          type: 'health_costs'
        },
        {
          _id: 'b3',
          originalDate: new Date(2018, 2, 10),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b4',
          originalDate: new Date(2018, 2, 15),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b5',
          originalDate: new Date(2018, 2, 15),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b6',
          originalDate: new Date(2018, 2, 20),
          vendor: 'Numéricable'
        },
        {
          _id: 'b7',
          originalDate: new Date(2018, 2, 20),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b8',
          originalDate: new Date(2018, 2, 20),
          vendor: 'Numéricable'
        },
        {
          _id: 'b9',
          originalDate: new Date(2018, 2, 20),
          vendor: 'Ameli',
          type: 'health_costs'
        },
        {
          _id: 'b10',
          originalDate: new Date(2018, 2, 30),
          vendor: 'Numéricable'
        }
      ]

      it('groups bills by vendor and originalDate', () => {
        const result = linker.groupBills(bills)

        expect(result).toContainEqual([bills[0], bills[2]])
        expect(result).toContainEqual([bills[1]])
        expect(result).toContainEqual([bills[3], bills[4]])
        expect(result).toContainEqual([bills[5], bills[7]])
        expect(result).toContainEqual([bills[6], bills[8]])
        expect(result).toContainEqual([bills[9]])
      })
    })

    describe('generateBillsCombinations', () => {
      const bills = [{ _id: 'b1' }, { _id: 'b2' }, { _id: 'b3' }, { _id: 'b4' }]

      it('generates the right combinations', () => {
        const result = linker.generateBillsCombinations(bills)

        expect(result).toContainEqual([bills[0], bills[1]])
        expect(result).toContainEqual([bills[0], bills[2]])
        expect(result).toContainEqual([bills[0], bills[3]])
        expect(result).toContainEqual([bills[1], bills[2]])
        expect(result).toContainEqual([bills[1], bills[3]])
        expect(result).toContainEqual([bills[2], bills[3]])
        expect(result).toContainEqual([bills[0], bills[1], bills[2]])
        expect(result).toContainEqual([bills[0], bills[1], bills[3]])
        expect(result).toContainEqual([bills[0], bills[2], bills[3]])
        expect(result).toContainEqual([bills[1], bills[2], bills[3]])
        expect(result).toContainEqual([bills[0], bills[1], bills[2], bills[3]])
      })
    })

    describe('combineBills', () => {
      const bills = [
        {
          _id: 'b1',
          amount: 10,
          originalAmount: 20,
          originalDate: '2018-03-10T00:00:00Z'
        },
        {
          _id: 'b2',
          amount: 10,
          originalAmount: 10,
          originalDate: '2018-03-10T00:00:00Z'
        }
      ]

      it('generate a bill with the right amount', () => {
        const combinedBill = linker.combineBills(bills)
        expect(combinedBill.amount).toBe(20)
      })

      it('generates a bill with the right originalAmount', () => {
        const combinedBill = linker.combineBills(bills)
        expect(combinedBill.originalAmount).toBe(30)
      })

      it('generates a bill with the right originalDate', () => {
        const combinedBill = linker.combineBills(bills)
        expect(combinedBill.originalDate).toBe('2018-03-10T00:00:00Z')
      })
    })

    describe('mergeMatchingCriterias', () => {
      it('should merge criterias', () => {
        const bills = [
          {
            matchingCriterias: {
              labelRegex: '\\binulogic\\b',
              amountLowerDelta: 2,
              amountUpperDelta: 2,
              dateLowerDelta: 30,
              dateUpperDelta: 30
            }
          },
          {
            matchingCriterias: {
              labelRegex: '(impot|impots)',
              amountLowerDelta: 10,
              amountUpperDelta: 10,
              dateLowerDelta: 20,
              dateUpperDelta: 20
            }
          }
        ]

        const criterias = linker.mergeMatchingCriterias(bills)
        const regex = new RegExp(criterias.labelRegex, 'i')

        expect(criterias.labelRegex).toBe('(\\binulogic\\b|(impot|impots))')

        expect('INULOGIC 22-08-2019'.match(regex)).toBeTruthy()
        expect('IMPOT blablabla'.match(regex)).toBeTruthy()
        expect('IMPOTS blablabla'.match(regex)).toBeTruthy()
        expect('INULOGIC IMPOT IMPOTS'.match(regex)).toBeTruthy()
        expect(criterias.amountLowerDelta).toBe(10)
        expect(criterias.amountUpperDelta).toBe(10)
        expect(criterias.dateLowerDelta).toBe(30)
        expect(criterias.dateUpperDelta).toBe(30)
      })

      it('should use defaults if needed', () => {
        const bills = [
          {
            matchingCriterias: {
              amountLowerDelta: 2,
              dateLowerDelta: 10
            }
          },
          {}
        ]

        const criterias = linker.mergeMatchingCriterias(bills)

        expect(criterias.labelRegex).not.toBeDefined()
        expect(criterias.amountLowerDelta).toBe(2)
        expect(criterias.amountUpperDelta).toBe(0.001)
        expect(criterias.dateLowerDelta).toBe(15)
        expect(criterias.dateUpperDelta).toBe(29)
      })
    })
  })
})
