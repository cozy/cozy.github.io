import React from 'react'
import { mount } from 'enzyme'
import { createMockClient } from 'cozy-client/dist/mock'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import BarBalance from 'components/BarBalance'
import AppLike from 'test/AppLike'
import mockRouter from 'test/mockRouter'
import getClient from 'src/selectors/getClient'
import fixtures from 'test/fixtures'
import { GROUP_DOCTYPE, ACCOUNT_DOCTYPE, schema } from 'doctypes'
import { DumbBalanceDetailsHeader } from './BalanceDetailsHeader'

jest.mock('src/selectors/getClient', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('components/Bar', () => ({
  BarCenter: ({ children }) => children,
  BarRight: ({ children }) => children,
  BarLeft: ({ children }) => children
}))

jest.mock('cozy-ui/transpiled/react/hooks/useBreakpoints', () => ({
  __esModule: true,
  default: jest.fn(),
  BreakpointsProvider: ({ children }) => children
}))

const setup = options => {
  const { props, breakpoints } = options
  useBreakpoints.mockReturnValue(breakpoints)
  const router = {
    ...mockRouter,
    getCurrentLocation: () => ({
      pathname: '/'
    })
  }
  const client = createMockClient({
    queries: {
      groups: {
        doctype: GROUP_DOCTYPE,
        data: fixtures[GROUP_DOCTYPE]
      },
      accounts: {
        doctype: ACCOUNT_DOCTYPE,
        data: fixtures[ACCOUNT_DOCTYPE]
      }
    },
    clientOptions: {
      schema
    }
  })
  getClient.mockReturnValue(client)

  return mount(
    <AppLike router={router} client={client}>
      <DumbBalanceDetailsHeader filteredAccounts={[]} {...props} />
    </AppLike>
  )
}

describe('when showBalance is true', () => {
  describe('when rendered on mobile', () => {
    it('should show the balance in the bar', () => {
      const wrapper = setup({
        props: { showBalance: true },
        breakpoints: { isMobile: true }
      })

      expect(wrapper.find(BarBalance)).toHaveLength(1)
    })
  })

  describe('when rendered on tablet/desktop', () => {
    it('should not show the balance in the bar', () => {
      const wrapper = setup({
        props: { showBalance: true },
        breakpoints: { isMobile: false }
      })

      expect(wrapper.find(BarBalance)).toHaveLength(0)
    })
  })
})

describe('when showBalance is false', () => {
  it('should not show the balance in the bar', () => {
    const mobileWrapper = setup({
      breakpoints: { isMobile: true },
      props: { showBalance: false }
    })

    const notMobileWrapper = setup({
      breakpoints: { isMobile: false },
      props: { showBalance: false }
    })

    expect(mobileWrapper.find(BarBalance)).toHaveLength(0)
    expect(notMobileWrapper.find(BarBalance)).toHaveLength(0)
  })
})
