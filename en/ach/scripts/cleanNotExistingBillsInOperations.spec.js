const {
  findOperationsToUpdate
} = require('./cleanNotExistingBillsInOperations')

describe('findOperationsToUpdate', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    console.log.mockRestore()
  })

  it('should work with no bills or no operation', () => {
    expect(findOperationsToUpdate([], [])).toEqual({
      countMissingBills: 0,
      countMissingReimbursements: 0,
      opToUpdate: [],
      totalBills: 0,
      totalReimbursements: 0
    })
    expect(
      findOperationsToUpdate(
        [],
        [
          { bills: ['io.cozy.bills:id1'] },
          { reimbursements: [{ billId: 'io.cozy.bills:id2' }] }
        ]
      )
    ).toEqual({
      countMissingBills: 1,
      countMissingReimbursements: 1,
      opToUpdate: [{ bills: [] }, { reimbursements: [] }],
      totalBills: 1,
      totalReimbursements: 1
    })

    expect(
      findOperationsToUpdate([{ _id: 'id1' }, { _id: 'id2' }], [])
    ).toEqual({
      countMissingBills: 0,
      countMissingReimbursements: 0,
      opToUpdate: [],
      totalBills: 0,
      totalReimbursements: 0
    })
  })

  it('should properly update concerned operations', () => {
    expect(
      findOperationsToUpdate(
        [{ _id: 'id1' }, { _id: 'id3' }],
        [
          {
            bills: [
              'io.cozy.bills:id1',
              'io.cozy.bills:id3',
              'io.cozy.bills:id4'
            ]
          },
          { bills: ['io.cozy.bills:id4'] },
          {
            reimbursements: [
              { billId: 'io.cozy.bills:id2' },
              { billId: 'io.cozy.bills:id5' }
            ]
          }
        ]
      )
    ).toEqual({
      countMissingBills: 2,
      countMissingReimbursements: 2,
      opToUpdate: [
        { bills: ['io.cozy.bills:id1', 'io.cozy.bills:id3'] },
        { bills: [] },
        { reimbursements: [] }
      ],
      totalBills: 4,
      totalReimbursements: 2
    })
  })
})
