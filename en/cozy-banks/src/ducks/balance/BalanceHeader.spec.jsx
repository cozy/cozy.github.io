import React from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import BalanceHeader from './BalanceHeader'
import AppLike from 'test/AppLike'

jest.mock('components/KonnectorUpdateInfo', () => () => null)
jest.mock('ducks/balance/HistoryChart', () => () => null)

describe('Balance header', () => {
  it('should call onClickBalance when clicking on the Figure', async () => {
    const onClickBalance = jest.fn()
    const accounts = [{ _id: 'b123' }, { _id: 'b456' }]
    const transactionsCollection = { data: [] }
    const root = render(
      <AppLike>
        <BalanceHeader
          accountsBalance={1000}
          breakpoints={{ isMobile: true }}
          onClickBalance={onClickBalance}
          accounts={accounts}
          transactionsCollection={transactionsCollection}
        />
      </AppLike>
    )
    await act(async () => {})
    const balanceNumber = root.getByText('1 000,00')
    fireEvent.click(balanceNumber)
    expect(onClickBalance).toHaveBeenCalled()
  })
})
