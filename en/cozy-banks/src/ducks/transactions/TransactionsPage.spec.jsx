/* global mount */

import React from 'react'
import {
  DumbTransactionsPage,
  UnpluggedTransactionsPage,
  TransactionsPageBar
} from './TransactionsPage'
import data from '../../../test/fixtures'
import PropTypes from 'prop-types'
import AppLike from 'test/AppLike'
import { getClient } from 'ducks/client'

const allAccounts = data['io.cozy.bank.accounts']
const allTransactions = data['io.cozy.bank.operations']

// eslint-disable-next-line no-unused-vars
const client = getClient()

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

const useMobile = () => (window.innerWidth = 400)

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
  const Wrapper = ({ filteringDoc }) => (
    <AppLike>
      <UnpluggedTransactionsPage
        transactions={mkCollection(allTransactions, { fetchStatus: 'loaded' })}
        accounts={mkCollection(allAccounts, { fetchStatus: 'loaded' })}
        filteredTransactions={allTransactions}
        filteredAccounts={allAccounts}
        filteringDoc={filteringDoc}
      />
    </AppLike>
  )

  const setup = () => {
    const context = {
      router: {
        push: () => {},
        replace: () => {},
        go: () => {},
        goBack: () => {},
        goForward: () => {},
        setRouteLeaveHook: () => {},
        isActive: () => {},
        params: {
          subcategoryName,
          categoryName
        }
      }
    }
    const childContextTypes = {
      router: PropTypes.object
    }
    root = mount(<Wrapper />, { context, childContextTypes })
  }

  it('should not show the top balance on movements page on non mobile', () => {
    setup()
    expect(root.find(TransactionsPageBar).length).toBe(0)
  })

  it('should show the top balance on movements page on mobile', () => {
    useMobile()
    setup()
    expect(root.find(TransactionsPageBar).length).toBe(1)
  })

  it('should not show the top balance on movements page on mobile if inside category', () => {
    useMobile()
    categoryName = 'dailyLife'
    subcategoryName = 'supermarket'
    setup()
    expect(root.find(TransactionsPageBar).length).toBe(0)
  })

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

  it('should call handleChangeMonth if filteringDoc changed', () => {
    setup()
    const tp = root.find(DumbTransactionsPage)
    const instance = tp.instance()
    jest.spyOn(instance, 'handleChangeMonth')
    root.setProps({ filteringDoc: { _id: 'new-doc' } })
    expect(instance.handleChangeMonth).toHaveBeenCalled()
  })
})
