import MockDate from 'mockdate'
import {
  makeBalanceTransactionsConn,
  transactionsConn,
  HasManyReimbursements
} from './doctypes'

MockDate.set(new Date(2021, 5, 28))

describe('transactionsConn', () => {
  it('should have no limit', () => {
    expect(transactionsConn.query().limit).toBeNull()
  })
})

describe('makeBalanceTransactionsConn', () => {
  it('should have no limit', () => {
    const conn = makeBalanceTransactionsConn()
    const query = conn.query()
    expect(query.selector.date.$gt).toEqual('2020-06-28')
  })
})

describe('HasManyReimbursements', () => {
  describe('query', () => {
    it('should return a QueryDefinition with the right ids', () => {
      const doc = {
        reimbursements: [
          { billId: 'io.cozy.bills:b1' },
          { billId: 'io.cozy.bills:b2' },
          { billId: 'io.cozy.bills:b3' },
          {} // just to test that docs without billId are handled
        ]
      }

      const assoc = { name: 'reimbursements' }
      const queryDefinition = HasManyReimbursements.query(doc, null, assoc)

      expect(queryDefinition.ids).toEqual(['b1', 'b2', 'b3'])
    })
  })
})
