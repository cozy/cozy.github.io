import React from 'react'
import { DumbTriggerErrorCard as TriggerErrorCard } from './TriggerErrorCard'
import { shallow } from 'enzyme'

jest.mock('components/effects', () => ({
  useRedirectionURL: () => 'http://redirection'
}))

describe('trigger error card', () => {
  const setup = () => {
    const wrapper = shallow(
      <TriggerErrorCard
        t={x => x}
        breakpoints={{ isMobile: true }}
        count={1}
        index={0}
        trigger={{
          current_state: {
            last_error: 'LOGIN_FAILED'
          },
          message: {
            account: '1234',
            konnector: 'boursorama83'
          }
        }}
      />
    )
    return {
      wrapper
    }
  }
  it('should render correctly', () => {
    const { wrapper } = setup()
    expect(wrapper).toMatchSnapshot()
  })
})
