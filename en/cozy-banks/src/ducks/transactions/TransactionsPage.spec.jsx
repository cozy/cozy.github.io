/* global mount */

import React from 'react'
import {
  DumbTransactionsPage,
  UnpluggedTransactionsPage,
  STEP_INFINITE_SCROLL,
  MIN_NB_TRANSACTIONS_SHOWN
} from './TransactionsPage'
import data from '../../../test/fixtures'
import PropTypes from 'prop-types'
import AppLike from 'test/AppLike'
import { mkFakeChain } from 'test/client'
import { getClient } from 'ducks/client'
import mockRouter from 'test/mockRouter'

const allAccounts = data['io.cozy.bank.accounts']
const allTransactions = data['io.cozy.bank.operations']

const client = getClient()
client.chain = mkFakeChain()

const saveWindowWidth = () => {
  let windowWidth = window.innerWidth
  return () => {
    window.innerWidth = windowWidth
  }
}

jest.mock(
  'ducks/transactions/TransactionActionsProvider',
  () => ({ children }) => children
)
jest.mock('ducks/balance/HistoryChart', () => ({
  ConnectedHistoryChart: () => null
}))

// const useMobile = () => (window.innerWidth = 400)

const mkCollection = (data, options) => ({
  data,
  ...options
})

describe('TransactionsPage', () => {
  let root, categoryName, subcategoryName, restoreWindowWidth
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

  // Necessary wrapper to be able to use setProps since `setProps` is
  // only callable on the Enzyme root
  const Wrapper = ({ filteringDoc, filteredTransactions, router }) => (
    <AppLike client={client} router={router}>
      <UnpluggedTransactionsPage
        transactions={mkCollection(allTransactions, { fetchStatus: 'loaded' })}
        accounts={mkCollection(allAccounts, { fetchStatus: 'loaded' })}
        filteredTransactions={filteredTransactions || allTransactions}
        filteredAccounts={allAccounts}
        filteringDoc={filteringDoc}
      />
    </AppLike>
  )

  const setup = () => {
    const router = {
      ...mockRouter,
      getCurrentLocation: () => ({
        pathname: '/'
      }),
      params: {
        subcategoryName,
        categoryName
      }
    }
    const context = {
      router
    }
    const childContextTypes = {
      router: PropTypes.object
    }
    root = mount(<Wrapper router={router} />, { context, childContextTypes })
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

  it('should correctly set internal state if filteringDoc changed', () => {
    setup()
    const tp = root.find(DumbTransactionsPage)
    const instance = tp.instance()
    jest.spyOn(instance, 'handleChangeMonth')
    expect(tp.state('limitMax')).toBe(STEP_INFINITE_SCROLL)
    root.setProps({
      filteringDoc: { _id: 'new-doc' },
      filteredTransactions: [{ date: '2019-11-03T13:13' }]
    })
    expect(tp.state('currentMonth')).toBe('2019-11')
    expect(tp.state('limitMin')).toBe(0)
    expect(tp.state('limitMax')).toBe(MIN_NB_TRANSACTIONS_SHOWN)
  })
})
