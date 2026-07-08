import { renderHook } from '@testing-library/react'

import { useFetchInitialData } from './useFetchInitialData'
import { useQueryWithRetry } from './useQueryWithRetry'

jest.mock('./useQueryWithRetry')
jest.mock('cozy-logger', () => ({ __esModule: true, default: jest.fn() }))

const loadedQuery = {
  fetchStatus: 'loaded',
  data: [],
  isRetrying: false,
  hasError: false
}

describe('useFetchInitialData', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('does not report an error while a query is still retrying', () => {
    useQueryWithRetry
      .mockReturnValueOnce({
        fetchStatus: 'failed',
        data: undefined,
        isRetrying: true,
        hasError: false
      })
      .mockReturnValue(loadedQuery)

    const { result } = renderHook(() => useFetchInitialData())

    expect(result.current.hasError).toBe(false)
    expect(result.current.isFetching).toBe(true)
  })

  it('reports an error once a query has exhausted its retries', () => {
    useQueryWithRetry
      .mockReturnValueOnce({
        fetchStatus: 'failed',
        data: undefined,
        isRetrying: false,
        hasError: true
      })
      .mockReturnValue(loadedQuery)

    const { result } = renderHook(() => useFetchInitialData())

    expect(result.current.hasError).toBe(true)
  })
})
