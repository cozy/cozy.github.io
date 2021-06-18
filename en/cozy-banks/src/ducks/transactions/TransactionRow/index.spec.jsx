import { mount } from 'enzyme'
import React from 'react'
import AppLike from 'test/AppLike'
import TransactionRowMobile from './TransactionRowMobile'

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
    expect(root.text()).toEqual(
      'CafeteriaCarte de crédit - Boursorama-1,251.00€'
    )
  })

  it('should show application date', () => {
    const { root } = setup({
      transactionAttributes: { applicationDate: '2019-12-20T12:00' }
    })
    expect(root.text()).toEqual(
      'CafeteriaCarte de crédit - Boursorama December-1,251.00€'
    )
  })

  it('should not show application date if in the same month as original date', () => {
    const { root } = setup({
      transactionAttributes: { applicationDate: '2019-11-20T12:00' }
    })
    expect(root.text()).toEqual(
      'CafeteriaCarte de crédit - Boursorama-1,251.00€'
    )
  })
})
