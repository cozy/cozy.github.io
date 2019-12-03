import match from './match'
import { REIMBURSEMENTS_STATUS } from 'ducks/transactions/helpers'

jest.mock('cozy-flags', () => () => true)

describe('ReimbursementStatusAction match', () => {
  const transaction = {
    amount: -60
  }

  it('should match independently of the reimbursement status (since we need the matching to show the reimbursement status in the modal even if no reimbursement is expected)', () => {
    expect(match(transaction)).toBe(true)
    expect(
      match({
        ...transaction,
        reimbursementStatus: REIMBURSEMENTS_STATUS.reimbursed
      })
    ).toBe(true)
  })

  it('should not match credit', () => {
    expect(match(transaction)).toBe(true)
    expect(
      match({
        ...transaction,
        amount: 60,
        reimbursementStatus: REIMBURSEMENTS_STATUS.reimbursed
      })
    ).toBe(false)
  })
})
