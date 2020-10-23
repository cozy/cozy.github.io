import React from 'react'
import { mount } from 'enzyme'
import {
  CreditReserveSection,
  CharacteristicsSection,
  PaymentsSection,
  KeyInfosSection,
  Section,
  Row
} from './LoanDetailsPage'
import AppLike from 'test/AppLike'

const setup = (Component, props) => {
  const wrapper = mount(
    <AppLike>
      <Component {...props} />
    </AppLike>
  )

  return wrapper
}

describe('keys infos section', () => {
  describe('when at least one relevant data is defined', () => {
    it('should render defined data', () => {
      const wrapper = setup(KeyInfosSection, {
        account: {
          loan: {
            usedAmount: 10000,
            rate: 2
          },
          balance: -2000
        }
      })

      expect(wrapper.find(Section)).toHaveLength(1)
      expect(wrapper.find(Row)).toHaveLength(3)
    })
  })

  describe('when no relevant data is defined', () => {
    it('should not render', () => {
      const wrapper = setup(KeyInfosSection, { account: {} })

      expect(wrapper.html()).toBe('')
    })
  })
})

describe('payments section', () => {
  describe('when at least one relevant data is defined', () => {
    it('should render defined data', () => {
      const wrapper = setup(PaymentsSection, {
        account: {
          loan: {
            lastPaymentAmount: 1000,
            nextPaymentAmount: 1000
          }
        }
      })

      expect(wrapper.find(Section)).toHaveLength(1)
      expect(wrapper.find(Row)).toHaveLength(2)
    })
  })

  describe('when no relevant data is defined', () => {
    it('should not render', () => {
      const wrapper = setup(PaymentsSection, { account: {} })

      expect(wrapper.html()).toBe('')
    })
  })
})

describe('characteristics section', () => {
  describe('when at least one relevant data is defined', () => {
    it('should render defined data', () => {
      const wrapper = setup(CharacteristicsSection, {
        account: {
          loan: {
            subscriptionDate: '2019-11-01',
            maturityDate: '2020-11-01',
            nbPaymentsLeft: 12,
            nbPaymentsDone: 0
          }
        }
      })

      expect(wrapper.find(Section)).toHaveLength(1)
      expect(wrapper.find(Row)).toHaveLength(4)
    })
  })

  describe('when no relevant data is defined', () => {
    it('should not render', () => {
      const wrapper = setup(CharacteristicsSection, {
        account: {}
      })

      expect(wrapper.html()).toBe('')
    })
  })
})

describe('credit reserve section', () => {
  describe('when the account type is revolving credit', () => {
    describe('when at least one relevant data is defined', () => {
      it('should render defined data', () => {
        const wrapper = setup(CreditReserveSection, {
          account: {
            loan: {
              totalAmount: 10000,
              availableAmount: 5000
            },
            type: 'RevolvingCredit'
          }
        })

        expect(wrapper.find(Section)).toHaveLength(1)
        expect(wrapper.find(Row)).toHaveLength(2)
      })
    })

    describe('when no relevant data is defined', () => {
      it('should not render', () => {
        const wrapper = setup(CreditReserveSection, {
          account: { type: 'RevolvingCredit' }
        })

        expect(wrapper.html()).toBe('')
      })
    })
  })

  describe('when the account is not of type revolving credit', () => {
    it('should not render', () => {
      const wrapper = setup(CreditReserveSection, {
        account: { type: 'Checkings' }
      })

      expect(wrapper.html()).toBe('')
    })
  })
})
