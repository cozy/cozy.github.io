import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import ReimbursementStatusModal from './ReimbursementStatusModal'
import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures'

describe('reimbursement status modal', () => {
  it('should show a clickable list of choice', () => {
    const transaction = fixtures['io.cozy.bank.operations'][0]
    const onChange = jest.fn()
    const root = render(
      <AppLike>
        <ReimbursementStatusModal
          transaction={transaction}
          onChange={onChange}
        />
      </AppLike>
    )
    const reimbursedRow = root.getByText('I have already been reimbursed')
    fireEvent.click(reimbursedRow)
    expect(onChange).toHaveBeenCalledWith(expect.anything(), 'reimbursed')

    const notWaiting = root.getByText('I am not waiting for a reimbursement')
    fireEvent.click(notWaiting)
    expect(onChange).toHaveBeenCalledWith(expect.anything(), 'no-reimbursement')

    const waiting = root.getByText('I am waiting for a reimbursement')
    fireEvent.click(waiting)
    expect(onChange).toHaveBeenCalledWith(expect.anything(), 'pending')
  })
})
