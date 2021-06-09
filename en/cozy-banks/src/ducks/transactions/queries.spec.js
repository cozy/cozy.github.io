import { makeFilteredTransactionsConn } from './queries'

describe('makeFilteredTransactionsConn', () => {
  it('should output a disabled query if accounts/groups have not been fetched yet', () => {
    const conn1 = makeFilteredTransactionsConn({
      groups: {},
      accounts: {},
      filteringDoc: {
        _id: 'g1',
        _type: 'io.cozy.bank.groups'
      }
    })
    expect(conn1.enabled).toBe(false)
  })

  it('should output a query if accounts/groups have been fetched yet', () => {
    const conn1 = makeFilteredTransactionsConn({
      groups: {
        lastUpdate: Date.now(),
        data: [
          {
            _id: 'g1',
            accounts: {
              raw: ['a1', 'a2', 'a3']
            }
          }
        ]
      },
      accounts: {
        lastUpdate: Date.now()
      },
      filteringDoc: {
        _id: 'g1',
        _type: 'io.cozy.bank.groups'
      }
    })
    expect(conn1.enabled).toBe(true)
    const query = conn1.query()
    expect(query).toEqual(
      expect.objectContaining({
        indexedFields: ['date', 'account'],
        selector: {
          $or: [{ account: 'a1' }, { account: 'a2' }, { account: 'a3' }]
        },
        sort: [{ date: 'desc' }, { account: 'desc' }]
      })
    )
  })

  it('should work with virtual groups', () => {
    const conn1 = makeFilteredTransactionsConn({
      groups: {
        lastUpdate: Date.now(),
        data: []
      },
      accounts: {
        lastUpdate: Date.now()
      },
      filteringDoc: {
        _id: 'g1',
        _type: 'io.cozy.bank.groups',
        virtual: true,
        accounts: {
          raw: ['a1', 'a2', 'a3']
        }
      }
    })
    expect(conn1.enabled).toBe(true)
    const query = conn1.query()
    expect(query).toEqual(
      expect.objectContaining({
        indexedFields: ['date', 'account'],
        selector: {
          $or: [{ account: 'a1' }, { account: 'a2' }, { account: 'a3' }]
        },
        sort: [{ date: 'desc' }, { account: 'desc' }]
      })
    )
  })
})
