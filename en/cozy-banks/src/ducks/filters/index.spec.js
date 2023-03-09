import reducer, {
  filterByDoc,
  filterByAccounts,
  getFilteredTransactions,
  getFilteredAccounts,
  addFilterByPeriod,
  resetFilterByDoc
} from '.'

import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE, TRANSACTION_DOCTYPE } from 'doctypes'
import { DESTROY_ACCOUNT } from 'actions/accounts'
import {
  getTransactions,
  getAllGroups,
  getAccounts,
  getGroupsById,
  getAccountsById
} from 'selectors'
import tz from 'timezone'
import find from 'lodash/find'
import keyBy from 'lodash/keyBy'

const eu = tz(require('timezone/Europe'))
const jp = tz(require('timezone/Asia'))
const us = tz(require('timezone/America'))

jest.mock('selectors')

describe('filter reducer', function () {
  let state
  beforeEach(function () {
    state = {
      filteringDoc: null
    }
  })

  it('should be able to select account/group', function () {
    state = reducer(state, filterByDoc({ id: 'a123', _type: ACCOUNT_DOCTYPE }))
    expect(state.filteringDoc._type).toBe(ACCOUNT_DOCTYPE)
    expect(state.filteringDoc.id).toBe('a123')
  })

  it('should be able to select by group', function () {
    state = reducer(state, filterByDoc({ id: 'g123', _type: GROUP_DOCTYPE }))
    expect(state.filteringDoc._type).toBe(GROUP_DOCTYPE)
    expect(state.filteringDoc.id).toBe('g123')
  })

  it('should reset when there is a delete account event corresponding to the current account', function () {
    const account = { id: 'a123', _type: ACCOUNT_DOCTYPE }
    state = reducer(state, filterByDoc(account))
    state = reducer(state, { type: DESTROY_ACCOUNT, account })
    expect(state.filteringDoc).toBe(null)
  })

  it('should be able to filter by multiple accounts', function () {
    const accounts = [
      { _id: 'a123', _type: ACCOUNT_DOCTYPE },
      { _id: 'b456', _type: ACCOUNT_DOCTYPE }
    ]
    state = reducer(state, filterByAccounts(accounts))
    expect(state.filteringDoc).toEqual(['a123', 'b456'])
  })
})

const ISO_FORMAT = '%F %T%^z'
const parisDateStr = dateStr => eu(dateStr, ISO_FORMAT, 'Europe/Paris')
const nyDateStr = dateStr => us(dateStr, ISO_FORMAT, 'America/New_York')
const tokyoDateStr = dateStr => jp(dateStr, ISO_FORMAT, 'Asia/Tokyo')

const mockRelationship = (values, relationshipName) => {
  return {
    raw: values,
    target: {
      [relationshipName]: values
    }
  }
}

describe('filter selectors', () => {
  let state, findDoc

  const dispatchOnFilters = action => {
    state = { ...state, filters: reducer(state.filters, action) }
  }

  beforeEach(function () {
    state = {
      filters: {}
    }
    state.filters = reducer(state.filters, addFilterByPeriod('2018-01'))

    const transactions = [
      {
        _id: 't0',
        account: mockRelationship('a0', 'account'),
        label: 'Transaction 0',
        date: tokyoDateStr('2018-01-01')
      },
      {
        _id: 't1',
        account: mockRelationship('a1', 'account'),
        label: 'Transaction 1',
        date: parisDateStr('2018-01-03')
      },
      {
        _id: 't2',
        account: mockRelationship('a1', 'account'),
        label: 'Transaction 2',
        date: parisDateStr('2018-01-04')
      },
      {
        _id: 't3',
        account: mockRelationship('a2', 'account'),
        label: 'Transaction 3',
        date: parisDateStr('2018-01-05')
      },
      {
        _id: 't4',
        account: mockRelationship('a0', 'account'),
        label: 'Transaction 4',
        date: tokyoDateStr('2018-01-06')
      },
      {
        _id: 't5',
        account: mockRelationship('a6', 'account'),
        label: 'Transaction 5',
        date: tokyoDateStr('2018-01-07')
      },
      {
        _id: 't6',
        account: mockRelationship('a6', 'account'),
        label: 'Transaction 6',
        date: nyDateStr('2018-01-08')
      },
      {
        _id: 't7',
        account: mockRelationship('a0', 'account'),
        label: 'Transaction 7',
        date: tokyoDateStr('2018-02-01')
      },
      {
        _id: 't8',
        account: mockRelationship('a1', 'account'),
        label: 'Transaction 8',
        date: nyDateStr('2018-02-08')
      },
      {
        _id: 't9',
        account: mockRelationship('a1', 'account'),
        label: 'Transaction 9',
        date: parisDateStr('2018-02-08')
      },
      {
        _id: 't10',
        account: mockRelationship('a1', 'account'),
        label: 'Transaction 10',
        date: parisDateStr('2019-01-01')
      },
      {
        _id: 't11',
        account: mockRelationship('a1', 'account'),
        label: 'Transaction 11',
        date: parisDateStr('2019-01-02')
      },
      {
        _id: 't12',
        account: mockRelationship('a1', 'account'),
        label: 'Transaction 12',
        date: parisDateStr('2019-02-28'),
        realisationDate: parisDateStr('2019-01-28')
      }
    ]
    const accounts = [
      { _id: 'a0', _type: ACCOUNT_DOCTYPE, label: 'Account 0' },
      { _id: 'a1', _type: ACCOUNT_DOCTYPE, label: 'Account 1' },
      { _id: 'a2', _type: ACCOUNT_DOCTYPE, label: 'Account 2' }
    ]
    const groups = [
      {
        _id: 'g0',
        _type: GROUP_DOCTYPE,
        label: 'Group 0',
        accounts: mockRelationship(['a1', 'a0'], 'accounts')
      },
      {
        _id: 'g1',
        _type: GROUP_DOCTYPE,
        label: 'Group 1',
        accounts: mockRelationship(['a2'], 'accounts')
      },
      {
        _id: 'g2',
        _type: GROUP_DOCTYPE,
        label: 'Group 2',
        accounts: mockRelationship([], 'accounts')
      }
    ]

    const docStore = {
      [TRANSACTION_DOCTYPE]: transactions,
      [GROUP_DOCTYPE]: groups,
      [ACCOUNT_DOCTYPE]: accounts
    }

    getTransactions.mockReturnValue(docStore['io.cozy.bank.operations'])
    getAccounts.mockReturnValue(docStore[ACCOUNT_DOCTYPE])
    getAllGroups.mockReturnValue(docStore['io.cozy.bank.groups'])
    // TODO use createMockClient instead of mocked selectors
    getGroupsById.mockReturnValue(keyBy(docStore['io.cozy.bank.groups'], '_id'))
    getAccountsById.mockReturnValue(
      keyBy(docStore['io.cozy.bank.accounts'], '_id')
    )

    findDoc = attrs => {
      const docs = docStore[attrs._type]
      const res = find(docs, x => x._id == attrs._id)
      return res
    }
  })

  const checkReset = () => {
    dispatchOnFilters(resetFilterByDoc())
    expect(getFilteredTransactions(state).map(x => x._id)).toEqual([
      't4',
      't3',
      't2',
      't1',
      't0'
    ])
  }

  describe('reset', function () {
    it('should get transactions that have an account', () => {
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual([
        't4',
        't3',
        't2',
        't1',
        't0'
      ])
    })

    it('should work after a filter has been set', () => {
      dispatchOnFilters(filterByDoc({ _id: 'a0', _type: ACCOUNT_DOCTYPE }))
      checkReset()
    })
  })

  describe('setting filter', () => {
    it('should select transactions in a period', () => {
      dispatchOnFilters(addFilterByPeriod('2018-02'))
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual([
        't8',
        't9',
        't7'
      ])
      dispatchOnFilters(addFilterByPeriod('2018'))
      // t5, t6 are orphan transactions
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual([
        't8',
        't9',
        't7',
        't4',
        't3',
        't2',
        't1',
        't0'
      ])
      dispatchOnFilters(addFilterByPeriod('2019'))
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual([
        't12',
        't11',
        't10'
      ])

      // range
      dispatchOnFilters(
        addFilterByPeriod([new Date(2018, 1, 1), new Date(2019, 0, 1)])
      )
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual([
        't10',
        't8',
        't9'
      ])
    })

    it('should select transactions belonging to an account', () => {
      const doc = findDoc({ _id: 'a0', _type: ACCOUNT_DOCTYPE })
      dispatchOnFilters(filterByDoc(doc))
      expect(getFilteredAccounts(state).map(x => x._id)).toEqual(['a0'])
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual([
        't4',
        't0'
      ])
    })

    it('should select transactions belonging to an account 2', () => {
      const doc = findDoc({ _id: 'a1', _type: ACCOUNT_DOCTYPE })
      dispatchOnFilters(filterByDoc(doc))
      expect(getFilteredAccounts(state).map(x => x._id)).toEqual(['a1'])
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual([
        't2',
        't1'
      ])
    })

    it('should select transactions belonging to an account 3', () => {
      const doc = findDoc({ _id: 'a2', _type: ACCOUNT_DOCTYPE })
      dispatchOnFilters(filterByDoc(doc))
      expect(getFilteredAccounts(state).map(x => x._id)).toEqual(['a2'])
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual(['t3'])
    })

    it('should select transactions belonging to an account (unavailable account)', () => {
      // unavailable account
      const doc = findDoc({ _id: 'a6', _type: ACCOUNT_DOCTYPE })
      dispatchOnFilters(filterByDoc(doc))
      expect(getFilteredAccounts(state).map(x => x._id)).toEqual([
        'a0',
        'a1',
        'a2'
      ])

      checkReset()
    })

    it('should select transactions belonging to a group', () => {
      dispatchOnFilters(filterByDoc({ _id: 'g0', _type: GROUP_DOCTYPE }))
      expect(getFilteredAccounts(state).map(x => x._id)).toEqual(['a0', 'a1'])
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual([
        't4',
        't2',
        't1',
        't0'
      ])

      dispatchOnFilters(filterByDoc({ _id: 'g1', _type: GROUP_DOCTYPE }))
      expect(getFilteredAccounts(state).map(x => x._id)).toEqual(['a2'])
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual(['t3'])

      // unavailable group
      dispatchOnFilters(filterByDoc({ _id: 'g7', _type: GROUP_DOCTYPE }))
      expect(getFilteredAccounts(state).map(x => x._id)).toEqual([
        'a0',
        'a1',
        'a2'
      ])
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual([
        't4',
        't3',
        't2',
        't1',
        't0'
      ])

      checkReset()
    })

    it('should not select transactions when a group is empty', () => {
      dispatchOnFilters(filterByDoc({ _id: 'g2', _type: GROUP_DOCTYPE }))
      expect(getFilteredAccounts(state).map(x => x._id)).toEqual([])
      expect(getFilteredTransactions(state).map(x => x._id)).toEqual([])
    })
  })
})
