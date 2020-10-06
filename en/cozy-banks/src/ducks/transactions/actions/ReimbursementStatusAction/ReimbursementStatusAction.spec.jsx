import { DumbReimbursementStatusAction } from './ReimbursementStatusAction'
import React from 'react'
import { shallow } from 'enzyme'
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

    const wrapper = shallow(
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
    return { wrapper }
  }

  describe('transaction row context', () => {
    it('should render correctly for a pending reimbursement', () => {
      const { wrapper } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.pending
      })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a reimbursed transaction', () => {
      const { wrapper } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.reimbursed
      })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a late reimbursement', () => {
      const { wrapper } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.pending,
        isLate: true
      })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a transaction that will not be reimbursed', () => {
      const { wrapper } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.noReimbursement
      })
      expect(wrapper.html()).toMatchSnapshot()
    })
  })

  describe('modal item context', () => {
    it('should render correctly for a pending reimbursement', () => {
      const { wrapper } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.pending,
        isModalItem: true
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a reimbursed transaction', () => {
      const { wrapper } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.reimbursed,
        isModalItem: true
      })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a late reimbursement', () => {
      const { wrapper } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.pending,
        isLate: true,
        isModalItem: true
      })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a transaction that will not be reimbursed', () => {
      const { wrapper } = setup({
        reimbursementStatus: REIMBURSEMENTS_STATUS.noReimbursement,
        isModalItem: true
      })
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
