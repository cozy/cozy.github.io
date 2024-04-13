import { Q } from 'cozy-client'
import {
  makeFilteredTransactionsConn,
  makeEarliestLatestQueries,
  addMonthToConn,
  addPeriodToConn,
  makeAccounts
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
          account: { $in: ['a1', 'a2', 'a3'] }
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
          account: { $in: ['a1', 'a2', 'a3'] }
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
        indexedFields: ['account', 'date'],
        selector: {
          account: { $in: ['a1', 'a2', 'a3'] }
        },
        sort: [{ account: 'desc' }, { date: 'desc' }]
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
        indexedFields: ['account', 'date'],
        sort: [{ account: 'asc' }, { date: 'asc' }],
        limit: 1
      }),
      expect.objectContaining({
        selector: {
          account: 'comptelou1',
          date: { $gt: null }
        },
        indexedFields: ['account', 'date'],
        sort: [{ account: 'desc' }, { date: 'desc' }],
        limit: 1
      })
    ])
  })

  it('should make two queries that selects the earliest and latest transactions for multiple accounts', () => {
    const baseQuery = Q('io.cozy.bank.transactions').where({
      account: { $in: ['comptelou1', 'compteisa2'] }
    })

    expect(makeEarliestLatestQueries(baseQuery)).toEqual([
      expect.objectContaining({
        selector: {
          date: { $gt: null },
          account: { $in: ['comptelou1', 'compteisa2'] }
        },
        indexedFields: ['date', 'account'],
        sort: [{ date: 'asc' }, { account: 'asc' }],
        limit: 1
      }),
      expect.objectContaining({
        selector: {
          date: { $gt: null },
          account: { $in: ['comptelou1', 'compteisa2'] }
        },
        indexedFields: ['date', 'account'],
        sort: [{ date: 'desc' }, { account: 'desc' }],
        limit: 1
      })
    ])
  })
})

describe('addMonthToConn', () => {
  it('should keep the existing selector', () => {
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
    const conn2 = addMonthToConn(conn1, '2021-07')

    expect(conn2.query).toEqual(
      expect.objectContaining({
        selector: {
          account: { $in: ['a1', 'a2', 'a3'] },
          date: {
            // Use stringContaining not to have difference of timezones
            // between CI and local development
            $lt: expect.stringContaining('2021-07-31T')
          }
        }
      })
    )
  })
})

describe('addPeriodToConn', () => {
  it('should keep the existing selector', () => {
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
    const conn2 = addPeriodToConn({ baseConn: conn1, period: '2021-07' })

    expect(conn2.query).toEqual(
      expect.objectContaining({
        selector: {
          account: { $in: ['a1', 'a2', 'a3'] },
          date: {
            $gte: '2021-07-01T00:00',
            $lte: '2021-07-31T23:59'
          }
        }
      })
    )
  })

  it('should use _id selector instead of account for null filteringDoc', () => {
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
      filteringDoc: null
    })
    const conn2 = addPeriodToConn({ baseConn: conn1, period: '2021-07' })

    expect(conn2.query).toEqual(
      expect.objectContaining({
        selector: {
          _id: { $gt: null },
          date: {
            $gte: '2021-07-01T00:00',
            $lte: '2021-07-31T23:59'
          }
        },
        indexedFields: ['date']
      })
    )
  })
})

describe('makeAccounts', () => {
  it('should return empty array if no datas', () => {
    const filteringDoc = {}
    const groups = { data: [] }

    expect(makeAccounts(filteringDoc, groups)).toMatchObject([])
  })

  it('should return empty array if no accounts in filteringDoc for virtual filtering', () => {
    const filteringDoc = { virtual: true, accounts: undefined }
    const groups = { data: [] }

    expect(makeAccounts(filteringDoc, groups)).toMatchObject([])
  })

  it('should return filteringDoc accounts for virtual filtering', () => {
    const filteringDoc = { virtual: true, accounts: { raw: [{ id: '01' }] } }
    const groups = { data: [] }

    expect(makeAccounts(filteringDoc, groups)).toMatchObject([{ id: '01' }])
  })

  it('should return empty array if no groups', () => {
    const filteringDoc = { virtual: false, _id: '01' }
    const groups = { data: [] }

    expect(makeAccounts(filteringDoc, groups)).toMatchObject([])
  })

  it('should return empty array if no matching group', () => {
    const filteringDoc = { virtual: false, _id: '01' }
    const groups = {
      data: [{ _id: '02' }]
    }

    expect(makeAccounts(filteringDoc, groups)).toMatchObject([])
  })

  it('should return empty array if no raw accounts for a matched group', () => {
    const filteringDoc = { virtual: false, _id: '01' }
    const groups = {
      data: [{ _id: '01', accounts: { raw: undefined } }, { _id: '02' }]
    }

    expect(makeAccounts(filteringDoc, groups)).toMatchObject([])
  })

  it('should return raw account for a matched group', () => {
    const filteringDoc = { virtual: false, _id: '01' }
    const groups = {
      data: [{ _id: '01', accounts: { raw: [{ id: '01' }] } }, { _id: '02' }]
    }

    expect(makeAccounts(filteringDoc, groups)).toMatchObject([{ id: '01' }])
  })
})
