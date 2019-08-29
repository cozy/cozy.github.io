import { DumbReimbursementStatusAction } from './ReimbursementStatusAction'
import React from 'react'
import { shallow } from 'enzyme'
import { getReimbursementStatus, isReimbursementLate } from '../../helpers'

jest.mock('../../helpers')

describe('DumbReimbursementStatusAction', () => {
  const t = key => key

  describe('transaction row context', () => {
    it('should render correctly for a pending reimbursement', () => {
      getReimbursementStatus.mockReturnValueOnce('pending')

      const wrapper = shallow(
        <DumbReimbursementStatusAction
          t={t}
          transaction={{ reimbursementStatus: 'pending' }}
          isModalItem={false}
        />
      )

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a reimbursed transaction', () => {
      getReimbursementStatus.mockReturnValueOnce('reimbursed')

      const wrapper = shallow(
        <DumbReimbursementStatusAction
          t={t}
          transaction={{ reimbursementStatus: 'reimbursed' }}
          isModalItem={false}
        />
      )

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a late reimbursement', () => {
      getReimbursementStatus.mockReturnValueOnce('pending')
      isReimbursementLate.mockReturnValueOnce(true)

      const wrapper = shallow(
        <DumbReimbursementStatusAction
          t={t}
          transaction={{ reimbursementStatus: 'pending' }}
          isModalItem={false}
        />
      )

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a transaction that will not be reimbursed', () => {
      getReimbursementStatus.mockReturnValueOnce('no-reimbursement')

      const wrapper = shallow(
        <DumbReimbursementStatusAction
          t={t}
          transaction={{ reimbursementStatus: 'no-reimbursement' }}
          isModalItem={false}
        />
      )

      expect(wrapper.html()).toMatchSnapshot()
    })
  })

  describe('modal item context', () => {
    it('should render correctly for a pending reimbursement', () => {
      getReimbursementStatus.mockReturnValueOnce('pending')

      const wrapper = shallow(
        <DumbReimbursementStatusAction
          t={t}
          transaction={{ reimbursementStatus: 'pending' }}
          isModalItem={true}
        />
      )

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a reimbursed transaction', () => {
      getReimbursementStatus.mockReturnValueOnce('reimbursed')

      const wrapper = shallow(
        <DumbReimbursementStatusAction
          t={t}
          transaction={{ reimbursementStatus: 'reimbursed' }}
          isModalItem={true}
        />
      )

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a late reimbursement', () => {
      getReimbursementStatus.mockReturnValueOnce('pending')
      isReimbursementLate.mockReturnValueOnce(true)

      const wrapper = shallow(
        <DumbReimbursementStatusAction
          t={t}
          transaction={{ reimbursementStatus: 'pending' }}
          isModalItem={true}
        />
      )

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should render correctly for a transaction that will not be reimbursed', () => {
      getReimbursementStatus.mockReturnValueOnce('no-reimbursement')

      const wrapper = shallow(
        <DumbReimbursementStatusAction
          t={t}
          transaction={{ reimbursementStatus: 'no-reimbursement' }}
          isModalItem={true}
        />
      )

      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
