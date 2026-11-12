import { render, screen } from '@testing-library/react'
import React from 'react'

import { ThemeSwitcher } from './ThemeSwitcher'

import AppLike from '@/test/AppLike'

jest.mock('cozy-client', () => ({
  ...jest.requireActual('cozy-client'),
  useQuery: () => ({
    data: { attributes: { colorScheme: 'auto' }, meta: { rev: '1-a' } }
  })
}))

describe('ThemeSwitcher', () => {
  it('names each theme tab in the user language', () => {
    render(
      <AppLike>
        <ThemeSwitcher />
      </AppLike>
    )

    expect(screen.getByRole('tab', { name: 'Light theme' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Dark theme' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'System theme' })).toBeTruthy()
  })
})
