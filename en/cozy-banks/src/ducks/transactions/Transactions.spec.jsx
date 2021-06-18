/* global mount */

import React from 'react'
import { render } from '@testing-library/react'
import TransactionRowDesktop from './TransactionRow/TransactionRowDesktop'
import TransactionRowMobile from './TransactionRow/TransactionRowMobile'
import { TransactionsDumb, sortByDate } from './Transactions'
import data from '../../../test/fixtures'
import store from '../../../test/store'
import AppLike from '../../../test/AppLike'
import { getClient } from 'test/client'
import { normalizeData } from 'test/store'
import TransactionPageErrors from 'ducks/transactions/TransactionPageErrors'

// No need to test this here
jest.mock('ducks/transactions/TransactionPageErrors', () => () => null)

const allTransactions = data['io.cozy.bank.operations']

describe('transaction row', () => {
  let client, transaction

  const setup = (row, withTable) => {
    return render(
      <AppLike store={store} client={client}>
        {withTable ? (
          <table>
            <tbody>{row}</tbody>
          </table>
        ) : (
          row
        )}
      </AppLike>
    )
  }

  const rawTransaction = allTransactions[0]
  rawTransaction._type = 'io.cozy.bank.operations'

  beforeEach(() => {
    client = getClient()
    client.ensureStore()
    const datastore = normalizeData({
      'io.cozy.bank.accounts': data['io.cozy.bank.accounts']
    })
    jest
      .spyOn(client, 'getDocumentFromState')
      .mockImplementation((doctype, id) => {
        return datastore[doctype][id]
      })
    transaction = client.hydrateDocument(rawTransaction)
  })

  it('should render correctly on desktop', () => {
    const handleRef = jest.fn()
    const root = setup(
      <TransactionRowDesktop
        transaction={transaction}
        urls={{}}
        brands={[]}
        onRef={handleRef}
      />,
      true
    )
    expect(root.getByText('Compte courant Isabelle - BNPP')).toBeTruthy()
  })

  it('should render correctly on mobile', () => {
    const handleRef = jest.fn()
    const root = setup(
      <TransactionRowMobile
        onRef={handleRef}
        transaction={transaction}
        urls={{}}
        brands={[]}
      />,
      false
    )

    expect(root.getByText('Compte courant Isabelle - BNPP')).toBeTruthy()
    expect(handleRef).toHaveBeenCalled()
  })
})

describe('Transactions', () => {
  let i = 0
  const mockTransactions = data['io.cozy.bank.operations'].map(x => ({
    _id: `transaction-id-${i++}`,
    ...x
  }))
  const setup = ({ showTriggerErrors }) => {
    const Wrapper = ({ transactions = mockTransactions }) => {
      return (
        <AppLike>
          <TransactionsDumb
            breakpoints={{ isDesktop: false }}
            transactions={transactions}
            showTriggerErrors={showTriggerErrors}
            TransactionSections={() => <div />}
          />
        </AppLike>
      )
    }
    const root = mount(<Wrapper />)

    return { root, transactions: mockTransactions }
  }

  describe('when showTriggerErrors is false', () => {
    it('should not show transaction errors', () => {
      const { root } = setup({ showTriggerErrors: false })
      expect(root.find(TransactionPageErrors).length).toBe(0)
    })
  })

  describe('when showTriggerErrors is true', () => {
    it('should show transaction errors', () => {
      const { root } = setup({ showTriggerErrors: true })
      expect(root.find(TransactionPageErrors).length).toBe(1)
    })
  })

  it('should sort transactions from props on mount and on update', () => {
    const { root, transactions } = setup({ isOnSubcategory: false })

    const instance = root.find(TransactionsDumb).instance()
    expect(instance.transactions).toEqual(sortByDate(transactions))

    const slicedTransactions = transactions.slice(0, 10)
    root.setProps({ transactions: slicedTransactions })

    const instance2 = root.find(TransactionsDumb).instance()
    expect(instance2.transactions).toEqual(sortByDate(slicedTransactions))
  })
})
