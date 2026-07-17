import { renderHook } from '@testing-library/react'

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
jest.mock('react-redux', () => ({ useSelector: (): never[] => [] }))
jest.mock('@/lib/konnectors_typed', () => ({
  fetchRunningKonnectors: { definition: {}, options: {} },
  getRunningKonnectors: (): never[] => []
}))

describe('useHomeLayout', () => {
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
})
