import match from './match'
import { REIMBURSEMENTS_STATUS } from 'ducks/transactions/helpers'

jest.mock('cozy-flags', () => () => true)

describe('ReimbursementStatusAction match', () => {
  it('should not match if the transaction has a no-reimbursement status', () => {
    const transaction = {
      amount: 60
    }
    expect(match(transaction)).toBe(false)
    expect(
      match({
        ...transaction,
        reimbursementStatus: REIMBURSEMENTS_STATUS.reimbursed
      })
    ).toBe(true)
  })
})
