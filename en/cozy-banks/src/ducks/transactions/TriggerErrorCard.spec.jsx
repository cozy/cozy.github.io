import React from 'react'
import { render } from '@testing-library/react'
import AppLike from 'test/AppLike'

import { DumbTriggerErrorCard as TriggerErrorCard } from './TriggerErrorCard'

jest.mock('hooks/useRedirectionURL', () => () => [
  'http://redirection',
  () => {}
])

describe('trigger error card', () => {
  const setup = () => {
    const error = {
      bankName: 'Boursorama',
      trigger: {
        current_state: {
          last_error: 'LOGIN_FAILED'
        },
        message: {
          account: '1234',
          slug: 'boursorama83'
        }
      }
    }

    const root = render(
      <AppLike>
        <TriggerErrorCard
          breakpoints={{ isMobile: true }}
          count={1}
          index={0}
          error={error}
        />
      </AppLike>
    )
    return {
      root
    }
  }

  it('should render correctly', () => {
    const { root } = setup()
    expect(root.getByText('Incorrect or expired credentials')).toBeTruthy()
    expect(
      root.getByText('Your Boursorama data is no longer updated.')
    ).toBeTruthy()
    expect(root.getByText('Verify the connection')).toBeTruthy()
  })
})
