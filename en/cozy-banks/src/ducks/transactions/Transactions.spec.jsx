/* global mount */

import React from 'react'
import { RowDesktop, RowMobile } from './TransactionRow'
import { TransactionsDumb, sortByDate } from './Transactions'
import data from '../../../test/fixtures'
import store from '../../../test/store'
import AppLike from '../../../test/AppLike'
import { Caption } from 'cozy-ui/react/Text'
import { getClient } from 'test/client'
import { normalizeData } from 'test/store'

// No need to test this here
jest.mock('ducks/transactions/TransactionPageErrors', () => () => null)

const allTransactions = data['io.cozy.bank.operations']

describe('transaction row', () => {
  let root, client, transaction

  const wrapRow = (row, withTable) => (
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
    root = mount(
      wrapRow(
        <RowDesktop transaction={transaction} urls={{}} brands={[]} />,
        true
      )
    )
    expect(root.find(Caption).text()).toBe('Compte courant Isabelle - BNPP')
  })

  it('should render correctly on mobile', () => {
    const handleRef = jest.fn()
    root = mount(
      wrapRow(
        <RowMobile
          onRef={handleRef}
          transaction={transaction}
          urls={{}}
          brands={[]}
        />,
        false
      )
    )
    expect(root.find(Caption).text()).toBe('Compte courant Isabelle - BNPP')
    expect(handleRef).toHaveBeenCalled()
  })
})

describe('Transactions', () => {
  jest
    .spyOn(TransactionsDumb.prototype, 'renderTransactions')
    .mockReturnValue(<div />)

  it('should sort transactions from props on mount and on update', () => {
    const transactions = data['io.cozy.bank.operations']

    const root = mount(
      <TransactionsDumb
        breakpoints={{ isDesktop: false }}
        transactions={transactions}
      />
    )

    expect(root.instance().transactions).toEqual(sortByDate(transactions))

    const slicedTransactions = transactions.slice(0, 10)
    root.setProps({ transactions: slicedTransactions })

    expect(root.instance().transactions).toEqual(sortByDate(slicedTransactions))
  })
})
