import React from 'react'
import { shallow } from 'enzyme'
import { DumbHealthReimbursements } from './HealthReimbursements'
import Loading from 'components/Loading'
import fixtures from 'test/fixtures/unit-tests.json'
import { TransactionsWithSelection } from 'ducks/transactions/Transactions'
import { StoreLink } from 'components/StoreLink'

describe('HealthReimbursements', () => {
  it('should show a loading if the transactions are loading', () => {
    const root = shallow(
      <DumbHealthReimbursements
        fetchStatus="loading"
        triggers={{ fetchStatus: 'loaded' }}
        filteredTransactions={[]}
        addFilterByPeriod={jest.fn()}
      />
    )

    expect(root.find(Loading).length).toBe(1)
  })

  it('should show a loading if the brands are loading', () => {
    const root = shallow(
      <DumbHealthReimbursements
        fetchStatus="loaded"
        triggers={{ fetchStatus: 'loading' }}
        filteredTransactions={[]}
        addFilterByPeriod={jest.fn()}
      />
    )

    expect(root.find(Loading).length).toBe(1)
  })

  it('should show the pending reimbursements', () => {
    const pending = fixtures['io.cozy.bank.operations'].filter(
      transaction => transaction._id === 'paiementdocteur2'
    )

    // Wrapping in `AppLike` instead of giving `t` manually makes the test
    // fail: no `TransactionsWithSelection` exists
    const root = shallow(
      <DumbHealthReimbursements
        fetchStatus="loaded"
        filteredTransactions={pending}
        t={key => key}
        addFilterByPeriod={jest.fn()}
        brands={[]}
        triggers={{ fetchStatus: 'loaded' }}
      />
    )

    expect(root.find(TransactionsWithSelection).length).toBe(1)
  })

  it('should show the reimbursed transactions', () => {
    const reimbursed = fixtures['io.cozy.bank.operations'].filter(
      transaction => transaction._id === 'paiementdocteur'
    )

    const root = shallow(
      <DumbHealthReimbursements
        fetchStatus="loaded"
        filteredTransactions={reimbursed}
        t={key => key}
        addFilterByPeriod={jest.fn()}
        brands={[]}
        triggers={{ fetchStatus: 'loaded' }}
      />
    )

    expect(root.find(TransactionsWithSelection).length).toBe(1)
  })

  it('should show a button to open the store if there is no reimbursed transactions and no health brand with trigger', () => {
    const root = shallow(
      <DumbHealthReimbursements
        fetchStatus="loaded"
        filteredTransactions={[]}
        t={key => key}
        addFilterByPeriod={jest.fn()}
        brands={[]}
        triggers={{ fetchStatus: 'loaded' }}
      />
    )

    expect(root.find(StoreLink).length).toBe(1)
  })
})
