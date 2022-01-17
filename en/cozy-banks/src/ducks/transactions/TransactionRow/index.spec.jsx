import React from 'react'
import { mount } from 'enzyme'
import { render } from '@testing-library/react'

import AppLike from 'test/AppLike'
import { getClient } from 'test/client'
import store, { normalizeData } from 'test/store'
import data from 'test/fixtures'

import TransactionRowMobile from './TransactionRowMobile'
import TransactionRowDesktop from './TransactionRowDesktop'

const allTransactions = data['io.cozy.bank.operations']

describe('TransactionRowMobile', () => {
  const setup = ({ transactionAttributes } = {}) => {
    const SNACK_AND_WORK_MEALS = '400160'
    const transaction = {
      amount: -1251,
      date: '2019-11-20T12:00',
      label: 'Cafeteria',
      manualCategoryId: SNACK_AND_WORK_MEALS,
      account: {
        data: {
          _id: 'c0ffeedeadbeef',
          institutionLabel: 'Boursorama',
          label: 'Carte de crédit'
        }
      },
      ...transactionAttributes
    }
    const handleRef = jest.fn()
    const root = mount(
      <AppLike>
        <TransactionRowMobile transaction={transaction} onRef={handleRef} />
      </AppLike>
    )
    return { root }
  }

  it('should show transaction information', () => {
    const { root } = setup()
    // the special char for the space is important!
    expect(root.text()).toEqual(
      'CafeteriaCarte de crédit - Boursorama-1 251,00€'
    )
  })

  it('should show application date', () => {
    const { root } = setup({
      transactionAttributes: { applicationDate: '2019-12-20T12:00' }
    })
    expect(root.text()).toEqual(
      'CafeteriaCarte de crédit - Boursorama December-1 251,00€'
    )
  })

  it('should not show application date if in the same month as original date', () => {
    const { root } = setup({
      transactionAttributes: { applicationDate: '2019-11-20T12:00' }
    })
    expect(root.text()).toEqual(
      'CafeteriaCarte de crédit - Boursorama-1 251,00€'
    )
  })
})

describe('Transaction rows', () => {
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
