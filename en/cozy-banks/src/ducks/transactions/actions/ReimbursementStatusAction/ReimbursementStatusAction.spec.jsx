import { DumbReimbursementStatusAction } from './ReimbursementStatusAction'
import React from 'react'
import { shallow } from 'enzyme'
import { getReimbursementStatus, isReimbursementLate } from '../../helpers'

jest.mock('../../helpers')

describe('DumbReimbursementStatusAction', () => {
  const t = key => key

  const setup = ({ reimbursementStatus, isLate, isModalItem = false }) => {
    getReimbursementStatus.mockReturnValueOnce(reimbursementStatus)
    isReimbursementLate.mockReturnValueOnce(isLate)

    const wrapper = shallow(
      <DumbReimbursementStatusAction
        t={t}
        transaction={{ reimbursementStatus }}
        isModalItem={isModalItem}
        createDocument={() => {}}
        deleteDocument={() => {}}
        saveDocument={() => {}}
      />
    )
    return { wrapper }
  }

  describe('transaction row context', () => {
    it('should render correctly for a pending reimbursement', () => {
      const { wrapper } = setup({ reimbursementStatus: 'pending' })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a reimbursed transaction', () => {
      const { wrapper } = setup({ reimbursementStatus: 'reimbursed' })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a late reimbursement', () => {
      const { wrapper } = setup({
        reimbursementStatus: 'pending',
        isLate: true
      })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a transaction that will not be reimbursed', () => {
      const { wrapper } = setup({ reimbursementStatus: 'no-reimbursement' })
      expect(wrapper.html()).toMatchSnapshot()
    })
  })

  describe('modal item context', () => {
    it('should render correctly for a pending reimbursement', () => {
      const { wrapper } = setup({
        reimbursementStatus: 'pending',
        isModalItem: true
      })

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a reimbursed transaction', () => {
      const { wrapper } = setup({
        reimbursementStatus: 'reimbursed',
        isModalItem: true
      })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a late reimbursement', () => {
      const { wrapper } = setup({
        reimbursementStatus: 'pending',
        isLate: true,
        isModalItem: true
      })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a transaction that will not be reimbursed', () => {
      const { wrapper } = setup({
        reimbursementStatus: 'no-reimbursement',
        isModalItem: true
      })
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
