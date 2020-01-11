import React from 'react'
import { mount, shallow } from 'enzyme'
import { DumbHealthReimbursements } from './HealthReimbursements'
import Loading from 'components/Loading'
import fixtures from 'test/fixtures/unit-tests.json'
import { TransactionsWithSelection } from 'ducks/transactions/Transactions'
import { StoreLink } from 'components/StoreLink'
import AppLike from 'test/AppLike'
import Polyglot from 'node-polyglot'
import en from 'locales/en'
import format from 'date-fns/format'

const diveUntilAfter = (shallowMount, selector) => {
  let cur = shallowMount
  while (!cur.is(selector)) {
    cur = cur.dive()
  }
  return cur.dive()
}

const polyglot = new Polyglot()
polyglot.extend(en)

describe('HealthReimbursements', () => {
  const setup = ({
    mount: shouldMount = false,
    triggers,
    transactions,
    groupedHealthExpenses
  }) => {
    const instance = (shouldMount ? mount : shallow)(
      <AppLike>
        <DumbHealthReimbursements
          fetchStatus="loaded"
          t={polyglot.t.bind(polyglot)}
          f={format}
          triggers={triggers || { fetchStatus: 'loaded' }}
          transactions={transactions || { fetchStatus: 'loaded' }}
          groupedHealthExpenses={groupedHealthExpenses || {}}
          addFilterByPeriod={jest.fn()}
          brands={[]}
          currentPeriod="2020-01"
        />
      </AppLike>
    )

    return shouldMount
      ? instance
      : diveUntilAfter(instance, DumbHealthReimbursements)
  }
  it('should show a loading if the transactions are loading', () => {
    const root = setup({
      transactions: { fetchStatus: 'loading' }
    })

    expect(root.find(Loading).length).toBe(1)
  })

  it('should show a loading if the brands are loading', () => {
    const root = setup({ triggers: { fetchStatus: 'loading' } })

    expect(root.find(Loading).length).toBe(1)
  })

  it('should show the pending reimbursements', () => {
    const pending = fixtures['io.cozy.bank.operations'].filter(
      transaction => transaction._id === 'paiementdocteur2'
    )

    const root = setup({
      groupedHealthExpenses: {
        pending
      }
    })

    expect(root.find(TransactionsWithSelection).length).toBe(1)
  })

  it('should show the current filter value if no pending reimbursements', () => {
    const pending = []

    const root = setup({
      groupedHealthExpenses: {
        pending
      },
      mount: true
    })
    expect(root.text()).toContain('No awaiting reimbursement in January 2020.')
  })

  it('should show the reimbursed transactions', () => {
    const reimbursed = fixtures['io.cozy.bank.operations'].filter(
      transaction => transaction._id === 'paiementdocteur'
    )

    const root = setup({
      groupedHealthExpenses: {
        reimbursed
      }
    })

    expect(root.find(TransactionsWithSelection).length).toBe(1)
  })

  it('should show a button to open the store if there is no reimbursed transactions and no health brand with trigger', () => {
    const root = setup({
      groupedHealthExpenses: {}
    })

    expect(root.find(StoreLink).length).toBe(1)
  })
})
