import React from 'react'
import { render } from '@testing-library/react'

import fixtures from 'test/fixtures'
import AppLike from 'test/AppLike'

import TransactionRowMobile from './TransactionRowMobile'

describe('TransactionRowMobile', () => {
  const setup = ({ onRef }) => {
    const root = render(
      <AppLike>
        <TransactionRowMobile
          transaction={fixtures['io.cozy.bank.operations'][0]}
          filteringOnAccount={false}
          onRef={onRef}
        />
      </AppLike>
    )
    return { root }
  }

  it('should render without onRef', () => {
    const { root } = setup({ onRef: null })
    expect(root.getByText('Remboursement Pret Lcl')).toBeTruthy()
    expect(root.getByText('-1 231,00')).toBeTruthy()
  })

  it('should render without onRef', () => {
    const onRef = jest.fn()
    const { root } = setup({ onRef })
    expect(root.getByText('Remboursement Pret Lcl')).toBeTruthy()
    expect(root.getByText('-1 231,00')).toBeTruthy()
    expect(onRef).toHaveBeenCalledWith('reimbursement', expect.any(HTMLElement))
  })
})
