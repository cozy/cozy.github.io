/* global mount */

import React from 'react'
import { createMockClient } from 'cozy-client/dist/mock'

import fixtures from 'test/fixtures'
import PropTypes from 'prop-types'
import AppLike from 'test/AppLike'
import getClient from 'src/selectors/getClient'

import { GROUP_DOCTYPE, ACCOUNT_DOCTYPE, schema } from 'doctypes'

import {
  DumbTransactionsPage,
  UnpluggedTransactionsPage
} from './TransactionsPage'
jest.mock('hooks/useTransactionExtent', () => {
  return jest.fn().mockImplementation(() => {
    return ['', '', false]
  })
})

jest.mock('src/selectors/getClient', () => ({
  __esModule: true,
  default: jest.fn()
}))

const allAccounts = fixtures['io.cozy.bank.accounts']
const allTransactions = fixtures['io.cozy.bank.operations']

const saveWindowWidth = () => {
  let windowWidth = window.innerWidth
  return () => {
    window.innerWidth = windowWidth
  }
}

jest.mock(
  'ducks/transactions/TransactionActionsProvider',
  () =>
    ({ children }) =>
      children
)
jest.mock('ducks/balance/HistoryChart', () => ({
  ConnectedHistoryChart: () => null
}))

// const useMobile = () => (window.innerWidth = 400)

const mkCollection = (data, options) => ({
  data,
  ...options
})

// Necessary wrapper to be able to use setProps since `setProps` is
// only callable on the Enzyme root
const Wrapper = ({ filteringDoc, filteredTransactions, client }) => (
  <AppLike client={client}>
    <UnpluggedTransactionsPage
      transactions={mkCollection(allTransactions, { fetchStatus: 'loaded' })}
      accounts={mkCollection(allAccounts, { fetchStatus: 'loaded' })}
      filteredTransactions={filteredTransactions || allTransactions}
      filteredAccounts={allAccounts}
      filteringDoc={filteringDoc}
      isFetchingNewData={false}
    />
  </AppLike>
)

describe('TransactionsPage', () => {
  let root, restoreWindowWidth
  beforeEach(() => {
    restoreWindowWidth = saveWindowWidth()
    jest
      .spyOn(DumbTransactionsPage.prototype, 'renderTransactions')
      .mockReturnValue([])
  })

  afterEach(() => {
    restoreWindowWidth()
    jest.restoreAllMocks()
  })

  const setup = () => {
    const childContextTypes = {
      router: PropTypes.object
    }
    const client = createMockClient({
      queries: {
        groups: {
          doctype: GROUP_DOCTYPE,
          data: fixtures[GROUP_DOCTYPE]
        },
        accounts: {
          doctype: ACCOUNT_DOCTYPE,
          data: fixtures[ACCOUNT_DOCTYPE]
        }
      },
      clientOptions: {
        schema
      }
    })
    getClient.mockReturnValue(client)
    root = mount(<Wrapper client={client} />, {
      childContextTypes
    })
  }

  it('should handle change in top most transaction', () => {
    setup()
    const tp = root.find(DumbTransactionsPage)
    const instance = tp.instance()
    instance.setState = jest.fn()
    instance.handleChangeTopmostTransaction({ date: '2018-01-02T12:00' })
    expect(instance.setState).toHaveBeenCalledWith({
      currentMonth: '2018-01'
    })

    instance.handleChangeTopmostTransaction({
      realisationDate: '2018-03-30T12:00',
      date: '2018-04-30T12:00'
    })
    expect(instance.setState).toHaveBeenCalledWith({
      currentMonth: '2018-04'
    })

    instance.handleChangeTopmostTransaction({
      account: { data: { type: 'CreditCard' } },
      realisationDate: '2019-03-04T12:00',
      date: '2019-02-03T12:00'
    })
    expect(instance.setState).toHaveBeenCalledWith({
      currentMonth: '2019-03'
    })

    instance.handleChangeTopmostTransaction({
      realisationDate: '2019-03-04T12:00',
      date: '2019-02-03T12:00'
    })
    expect(instance.setState).toHaveBeenCalledWith({
      currentMonth: '2019-02'
    })
  })
})
