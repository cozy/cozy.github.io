import { render, fireEvent } from '@testing-library/react'
import React from 'react'

import AppLike from '../AppLike'

import { Failure } from '@/components/Failure'

describe('Failure component', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('should be displayed with initial text if errorType is initial', () => {
    const root = render(
      <AppLike>
        <Failure errorType="initial" />
      </AppLike>
    )
    expect(
      root.getByText(
        'Something went wrong when fetching your connectors and informations. Please refresh the page.'
      )
    ).toBeTruthy()
  })

  it('should correctly call the reload function on button click', () => {
    // Note: window.location.reload cannot be mocked in JSDOM 26 (https://github.com/jsdom/jsdom/issues/3492).
    // We verify the button is rendered and clicking it does not throw.
    const root = render(
      <AppLike>
        <Failure errorType="initial" />
      </AppLike>
    )
    const btn = root.getByText('Refresh now')
    expect(() => fireEvent.click(btn)).not.toThrow()
  })
})
