import { renderHook } from '@testing-library/react'
import { useSelector } from 'react-redux'

import { useSettings } from 'cozy-client'

import { useHomeLayout } from './useHomeLayout'

jest.mock('cozy-client', () => ({
  ...jest.requireActual('cozy-client'),
  useSettings: jest.fn(),
  useQuery: (): { data: never[]; fetchStatus: string } => ({
    data: [],
    fetchStatus: 'loaded'
  }),
  useFetchHomeShortcuts: (): never[] => [],
  useAppsInMaintenance: (): never[] => []
}))
jest.mock('react-redux', () => ({ useSelector: jest.fn() }))
jest.mock('@/lib/konnectors_typed', () => ({
  fetchRunningKonnectors: { definition: {}, options: {} },
  getRunningKonnectors: (): never[] => []
}))

const makeState = (
  konnectors: Record<string, unknown> | undefined
): unknown => ({
  cozy: { documents: { 'io.cozy.konnectors': konnectors } }
})

const selectFrom = (state: unknown): void => {
  ;(useSelector as jest.Mock).mockImplementation(
    (selector: (s: unknown) => unknown) => selector(state)
  )
}

describe('useHomeLayout', () => {
  beforeEach(() => {
    selectFrom(makeState(undefined))
  })

  it('reads layout and saves through useSettings', () => {
    const save = jest.fn()
    ;(useSettings as jest.Mock).mockReturnValue({
      query: { fetchStatus: 'loaded' },
      values: { homeLayout: { order: ['app:drive'], folders: {} } },
      save
    })
    const { result } = renderHook(() => useHomeLayout())
    expect(result.current.layout).toEqual({ order: ['app:drive'], folders: {} })
    result.current.saveLayout({ order: ['app:notes'], folders: {} })
    expect(save).toHaveBeenCalledWith({
      homeLayout: { order: ['app:notes'], folders: {} }
    })
  })

  it('falls back to an empty layout', () => {
    ;(useSettings as jest.Mock).mockReturnValue({
      query: { fetchStatus: 'loaded' },
      values: {},
      save: jest.fn()
    })
    const { result } = renderHook(() => useHomeLayout())
    expect(result.current.layout).toEqual({ order: [], folders: {} })
  })

  it('builds konnector items from the id-keyed documents store', () => {
    ;(useSettings as jest.Mock).mockReturnValue({
      query: { fetchStatus: 'loaded' },
      values: {},
      save: jest.fn()
    })
    selectFrom(
      makeState({
        'id-b': { _id: 'id-b', slug: 'bouygues', name: 'Bouygues' },
        'id-a': { _id: 'id-a', slug: 'ameli', name: 'Ameli' }
      })
    )
    const { result } = renderHook(() => useHomeLayout())
    expect(result.current.items.map(item => item.id)).toEqual([
      'konnector:ameli',
      'konnector:bouygues'
    ])
  })
})
