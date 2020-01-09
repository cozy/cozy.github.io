/* global mount */

import React from 'react'
import { Figure } from 'components/Figure'
import { DumbBalanceHeader } from './BalanceHeader'
import AppLike from 'test/AppLike'

jest.mock('components/KonnectorUpdateInfo', () => () => null)
jest.mock('ducks/balance/HistoryChart', () => () => null)

describe('Balance header', () => {
  let root
  it('should call onClickBalance when clicking on the Figure', () => {
    const onClickBalance = jest.fn()
    const accounts = [{ _id: 'b123' }, { _id: 'b456' }]
    const transactionsCollection = { data: [] }
    root = mount(
      <AppLike>
        <DumbBalanceHeader
          accountsBalance={1000}
          breakpoints={{ isMobile: true }}
          onClickBalance={onClickBalance}
          accounts={accounts}
          transactionsCollection={transactionsCollection}
        />
      </AppLike>
    )
    const fig = root.find(Figure)
    fig.simulate('click')
    expect(onClickBalance).toHaveBeenCalled()
  })
})
