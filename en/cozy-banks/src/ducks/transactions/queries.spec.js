import { Q } from 'cozy-client'
import {
  makeFilteredTransactionsConn,
  makeEarliestLatestQueries
} from './queries'

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

  it('should work with array of account ids (when clicking account balance header, filteringDoc is an array of account ids)', () => {
    const conn1 = makeFilteredTransactionsConn({
      groups: {
        lastUpdate: Date.now(),
        data: []
      },
      accounts: {
        lastUpdate: Date.now()
      },
      filteringDoc: ['a1', 'a2', 'a3']
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

describe('makeEarliestLatestQueries', () => {
  it('should make two queries that selects the earliest and latest transactions for one account', () => {
    const baseQuery = Q('io.cozy.bank.transactions').where({
      account: 'comptelou1'
    })
    expect(makeEarliestLatestQueries(baseQuery)).toEqual([
      expect.objectContaining({
        selector: {
          account: 'comptelou1',
          date: { $gt: null }
        },
        indexedFields: ['date'],
        sort: [{ date: 'asc' }],
        limit: 1
      }),
      expect.objectContaining({
        selector: {
          account: 'comptelou1',
          date: { $gt: null }
        },
        indexedFields: ['date'],
        sort: [{ date: 'desc' }],
        limit: 1
      })
    ])
  })

  it('should make two queries that selects the earliest and latest transactions for multiple accounts', () => {
    const baseQuery = Q('io.cozy.bank.transactions').where({
      $or: [{ account: 'comptelou1' }, { account: 'compteisa2' }]
    })
    expect(makeEarliestLatestQueries(baseQuery)).toEqual([
      expect.objectContaining({
        selector: {
          $or: [{ account: 'comptelou1' }, { account: 'compteisa2' }],
          date: { $gt: null }
        },
        indexedFields: ['date'],
        sort: [{ date: 'asc' }],
        limit: 1
      }),
      expect.objectContaining({
        selector: {
          $or: [{ account: 'comptelou1' }, { account: 'compteisa2' }],
          date: { $gt: null }
        },
        indexedFields: ['date'],
        sort: [{ date: 'desc' }],
        limit: 1
      })
    ])
  })
})
