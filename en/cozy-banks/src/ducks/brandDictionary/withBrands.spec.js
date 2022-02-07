import { renderHook } from '@testing-library/react-hooks'

import { useBrands } from './withBrands'
import { getInstalledBrandsFromQuery } from './selectors'

jest.mock('./selectors', () => ({
  getInstalledBrandsFromQuery: jest.fn().mockReturnValue(() => 'brands')
}))

jest.mock('react-redux', () => ({
  useStore: jest.fn(),
  createSelectorHook: jest.fn()
}))

describe('useBrands', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return getInstalledBrandsFromQuery from state', () => {
    const render = renderHook(useBrands)

    expect(render.result.current).toEqual({ brands: 'brands' })
  })

  it('should call getInstalledBrandsFromQuery with `triggers`', () => {
    renderHook(useBrands)

    expect(getInstalledBrandsFromQuery).toHaveBeenCalledWith('triggers')
    expect(getInstalledBrandsFromQuery).toHaveBeenCalledTimes(1)
  })

  it('should call getInstalledBrandsFromQuery with `test`', () => {
    renderHook(() => useBrands({ queryName: 'test' }))

    expect(getInstalledBrandsFromQuery).toHaveBeenCalledWith('test')
    expect(getInstalledBrandsFromQuery).toHaveBeenCalledTimes(1)
  })
})
