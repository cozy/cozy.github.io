import { render } from '@testing-library/react'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { HashRouter } from 'react-router-dom'

import { isFlagshipApp } from 'cozy-device-helper'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'

import App from '../components/AnimatedWrapper'

import { WallPaperProvider } from '@/hooks/useWallpaperContext'
import AppLike from '@/test/AppLike'

jest.mock('components/HeroHeader', () => () => <div data-testid="HeroHeader" />)

jest.mock('cozy-device-helper', () => ({
  ...jest.requireActual('cozy-device-helper'),
  isFlagshipApp: jest.fn(),
  getFlagshipMetadata: jest.fn().mockReturnValue({
    immersive: jest.fn()
  }),
  isAndroidApp: jest.fn(),
  isIOS: jest.fn()
}))

jest.mock('cozy-bar', () => ({
  BarComponent: () => <div data-testid="BarComponent" />
}))

jest.mock('cozy-harvest-lib', () => ({
  HarvestRoutes: ({ konnector, triggers, onDismiss }) => (
    // eslint-disable-next-line react/no-unknown-property
    <div konnector={konnector} triggers={triggers} onClick={onDismiss}>
      {konnector.slug}
    </div>
  )
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),

  Routes: jest.fn(),
  useNavigate: () => () => {},

  withRouter: Component => props => <Component {...props} />
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),

  withRouter: Component => props => <Component {...props} />
}))

describe('App', () => {
  it('should keep backgroundImage fixed on Flagship app scroll', async () => {
    // Given
    isFlagshipApp.mockReturnValue(true)

    // When
    const { container } = render(
      <AppLike>
        <CozyTheme>
          <WallPaperProvider>
            <HashRouter>
              <App />
            </HashRouter>
          </WallPaperProvider>
        </CozyTheme>
      </AppLike>
    )
    await act(async () => {})
    // Then
    expect(
      container
        .querySelector(
          '.App.u-flex.u-flex-column.u-w-100.u-miw-100.u-flex-items-center'
        )
        .getAttribute('style')
    ).toEqual('position: fixed; height: 100%;')
  })

  it(`should not keep backgroundImage fixed on mobile's browser scroll`, async () => {
    // Given
    isFlagshipApp.mockReturnValue(false)

    // When
    const { container } = render(
      <AppLike>
        <CozyTheme>
          <WallPaperProvider>
            <HashRouter>
              <App />
            </HashRouter>
          </WallPaperProvider>
        </CozyTheme>
      </AppLike>
    )
    await act(async () => {})
    // Then
    expect(
      container
        .querySelector(
          '.App.u-flex.u-flex-column.u-w-100.u-miw-100.u-flex-items-center'
        )
        .getAttribute('style')
    ).toBeNull()
  })
})
