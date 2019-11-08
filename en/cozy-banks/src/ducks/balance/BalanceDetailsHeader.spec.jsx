import React from 'react'
import { mount } from 'enzyme'
import PropTypes from 'prop-types'
import { DumbBalanceDetailsHeader } from './BalanceDetailsHeader'
import BarBalance from 'components/BarBalance'
import AppLike from 'test/AppLike'
import { getClient } from 'ducks/client'

// eslint-disable-next-line no-unused-vars
const client = getClient()

const setup = props => {
  return mount(
    <AppLike>
      <DumbBalanceDetailsHeader filteredAccounts={[]} {...props} />
    </AppLike>,
    {
      context: {
        router: {
          getCurrentLocation: () => ({
            pathname: '/'
          })
        }
      },
      childContextTypes: {
        router: PropTypes.object
      }
    }
  )
}

describe('when showBalance is true', () => {
  describe('when rendered on mobile', () => {
    it('should show the balance in the bar', () => {
      const wrapper = setup({
        breakpoints: { isMobile: true },
        showBalance: true
      })

      expect(wrapper.find(BarBalance)).toHaveLength(1)
    })
  })

  describe('when rendered on tablet/desktop', () => {
    it('should not show the balance in the bar', () => {
      const wrapper = setup({
        breakpoints: { isMobile: false },
        showBalance: true
      })

      expect(wrapper.find(BarBalance)).toHaveLength(0)
    })
  })
})

describe('when showBalance is false', () => {
  it('should not show the balance in the bar', () => {
    const mobileWrapper = setup({
      breakpoints: { isMobile: true },
      showBalance: false
    })

    const notMobileWrapper = setup({
      breakpoints: { isMobile: false },
      showBalance: false
    })

    expect(mobileWrapper.find(BarBalance)).toHaveLength(0)
    expect(notMobileWrapper.find(BarBalance)).toHaveLength(0)
  })
})
