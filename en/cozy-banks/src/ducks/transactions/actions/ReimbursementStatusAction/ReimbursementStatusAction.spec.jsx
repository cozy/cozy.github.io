import { DumbReimbursementStatusAction } from './ReimbursementStatusAction'
import React from 'react'
import { render } from '@testing-library/react'
import {
  REIMBURSEMENTS_STATUS,
  getReimbursementStatus,
  isReimbursementLate
} from '../../helpers'
import AppLike from 'test/AppLike'

jest.mock('../../helpers')

describe('DumbReimbursementStatusAction', () => {
  const setup = ({ reimbursementStatus, isLate, isModalItem = false }) => {
    getReimbursementStatus.mockReturnValueOnce(reimbursementStatus)
    isReimbursementLate.mockReturnValueOnce(isLate)

    const root = render(
      <AppLike>
        <DumbReimbursementStatusAction
          transaction={{ reimbursementStatus }}
          isModalItem={isModalItem}
          createDocument={() => {}}
          deleteDocument={() => {}}
          saveDocument={() => {}}
        />
      </AppLike>
    )
    return { root }
  }

  describe('transaction row context', () => {
    it('should render correctly for a pending reimbursement', () => {
      const { root } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.pending
      })
      expect(root.getByText('No reimbursement yet')).toBeTruthy()
    })

    it('should render correctly for a reimbursed transaction', () => {
      const { root } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.reimbursed
      })
      expect(root.getByText('Reimbursed')).toBeTruthy()
    })

    it('should render correctly for a late reimbursement', () => {
      const { root } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.pending,
        isLate: true
      })
      expect(root.getByText('Late reimbursement')).toBeTruthy()
    })

    it('should render correctly for a transaction that will not be reimbursed', () => {
      const { root } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.noReimbursement
      })
      // We do not show a chip when there is no expected reimbursement
      expect(root.queryByText('No expected reimbursement')).toBeFalsy()
    })
  })

  describe('modal item context', () => {
    it('should render correctly for a pending reimbursement', () => {
      const { root } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.pending,
        isModalItem: true
      })

      expect(root.getByText('No reimbursement yet')).toBeTruthy()
    })

    it('should render correctly for a reimbursed transaction', () => {
      const { root } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.reimbursed,
        isModalItem: true
      })
      expect(root.getByText('Reimbursed')).toBeTruthy()
    })

    it('should render correctly for a late reimbursement', () => {
      const { root } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.pending,
        isLate: true,
        isModalItem: true
      })
      expect(root.getByText('Late reimbursement')).toBeTruthy()
    })

    it('should render correctly for a transaction that will not be reimbursed', () => {
      const { root } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.noReimbursement,
        isModalItem: true
      })
      expect(root.getByText('No expected reimbursement')).toBeTruthy()
    })
  })
})
