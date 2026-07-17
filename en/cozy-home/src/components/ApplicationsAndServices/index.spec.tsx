import { render, screen } from '@testing-library/react'
import React from 'react'

import flag from 'cozy-flags'

import ApplicationsAndServicesEntry, { ApplicationsAndServices } from './index'
import { useHomeLayout } from './useHomeLayout'

import AppLike from '@/test/AppLike'

jest.mock('cozy-flags', () => ({
  __esModule: true,
  default: jest.fn(() => false)
}))
jest.mock('./LegacyApplicationsAndServices', () => ({
  __esModule: true,
  default: (): JSX.Element => <div data-testid="legacy" />
}))
jest.mock('./useHomeLayout')
jest.mock('@/components/AppTile', () => ({
  __esModule: true,
  default: ({ app }: { app: { slug: string } }): JSX.Element => (
    <div data-testid="tile">{app.slug}</div>
  )
}))
jest.mock('@/components/AppHighlightAlert/AppHighlightAlertWrapper', () => ({
  __esModule: true,
  default: (): null => null
}))
jest.mock('@/components/AddTile', () => ({
  __esModule: true,
  default: (): JSX.Element => <div data-testid="add-tile" />
}))

const appItem = (
  slug: string
): { type: string; id: string; app: { slug: string } } => ({
  type: 'app',
  id: `app:${slug}`,
  app: { slug }
})

const setup = ({
  items = [appItem('drive'), appItem('notes')],
  layout = {
    order: [] as string[],
    folders: {} as Record<string, { name: string; items: string[] }>
  },
  hasLoaded = true,
  isAppsLoading = false
} = {}): void => {
  ;(useHomeLayout as jest.Mock).mockReturnValue({
    hasLoaded,
    isAppsLoading,
    items,
    layout,
    apps: [],
    saveLayout: jest.fn()
  })
  render(
    <AppLike>
      <ApplicationsAndServices />
    </AppLike>
  )
}

describe('ApplicationsAndServices', () => {
  it('renders tiles in default order', () => {
    setup()
    expect(screen.getAllByTestId('tile').map(t => t.textContent)).toEqual([
      'drive',
      'notes'
    ])
  })

  it('renders a folder from the layout', () => {
    setup({
      items: [appItem('drive'), appItem('notes')],
      layout: {
        order: ['folder:a'],
        folders: {
          'folder:a': { name: 'G', items: ['app:drive', 'app:notes'] }
        }
      }
    })
    expect(screen.queryByTestId('folder-tile')).toBeInTheDocument()
  })

  it('shows loading tiles before load', () => {
    setup({ hasLoaded: false })
    expect(screen.queryByTestId('tile')).toBe(null)
  })
})

describe('ApplicationsAndServices flag gating', () => {
  beforeEach(() => {
    ;(useHomeLayout as jest.Mock).mockReturnValue({
      hasLoaded: true,
      isAppsLoading: false,
      items: [appItem('drive')],
      layout: { order: [], folders: {} },
      apps: [],
      saveLayout: jest.fn()
    })
  })

  it('renders the legacy list when the folders flag is off', () => {
    ;(flag as unknown as jest.Mock).mockReturnValue(false)
    render(
      <AppLike>
        <ApplicationsAndServicesEntry />
      </AppLike>
    )
    expect(screen.getByTestId('legacy')).toBeInTheDocument()
    expect(screen.queryByTestId('tile')).toBe(null)
  })

  it('renders the folders grid when the flag is on', () => {
    ;(flag as unknown as jest.Mock).mockImplementation(
      (name: string) => name === 'home.apps.folders'
    )
    render(
      <AppLike>
        <ApplicationsAndServicesEntry />
      </AppLike>
    )
    expect(screen.getByTestId('tile')).toHaveTextContent('drive')
    expect(screen.queryByTestId('legacy')).toBe(null)
  })
})
