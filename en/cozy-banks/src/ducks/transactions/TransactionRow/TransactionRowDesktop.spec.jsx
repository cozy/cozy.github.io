import React from 'react'
import { render } from '@testing-library/react'

import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures'
import TransactionRowDesktop from './TransactionRowDesktop'

// TransactionRowDesktop is mainly tested via Transactions.spec.jsx
// This is why this file is so short
describe('TransactionRowDesktop', () => {
  const setup = () => {
    const transaction = fixtures['io.cozy.bank.operations'][0]
    const root = render(
      <AppLike>
        <TransactionRowDesktop transaction={transaction} />
      </AppLike>
    )
    return { root }
  }

  it('should render', () => {
    const { root } = setup()
    expect(root.getByText('25 Aug 2017')).toBeTruthy()
    expect(root.getByText('Remboursement Pret Lcl')).toBeTruthy()
  })
})
