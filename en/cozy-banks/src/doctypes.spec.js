import { transactionsConn, HasManyReimbursements } from './doctypes'
import getClient from 'test/client'

const client = getClient()

describe('transactionsConn', () => {
  it('should have no limit', () => {
    expect(transactionsConn.query(client).limit).toBeNull()
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
