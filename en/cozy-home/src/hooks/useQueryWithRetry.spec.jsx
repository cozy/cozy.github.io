import { act, renderHook } from '@testing-library/react'

import { useQuery } from 'cozy-client'

import { useQueryWithRetry } from './useQueryWithRetry'

jest.mock('cozy-client')

const definition = jest.fn()
const options = { as: 'io.cozy.test' }

describe('useQueryWithRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('retries a failed query by calling fetch() after a backoff delay', () => {
    const fetch = jest.fn()
    useQuery.mockReturnValue({ fetchStatus: 'failed', data: undefined, fetch })

    renderHook(() => useQueryWithRetry(definition, options))

    expect(fetch).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('surfaces hasError only once the retries are exhausted', () => {
    const fetch = jest.fn()
    useQuery.mockReturnValue({ fetchStatus: 'failed', data: undefined, fetch })

    const { result } = renderHook(() => useQueryWithRetry(definition, options))

    // While retries remain, the failure is not surfaced as an error
    expect(result.current.isRetrying).toBe(true)
    expect(result.current.hasError).toBe(false)

    // Exhaust the retries (exponential backoff: 500 → 1000 → 2000)
    act(() => {
      jest.advanceTimersByTime(500)
    })
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(result.current.isRetrying).toBe(false)
    expect(result.current.hasError).toBe(true)

    // No further retries are scheduled once exhausted
    act(() => {
      jest.advanceTimersByTime(10000)
    })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('resets its retry budget after a successful load', () => {
    const fetch = jest.fn()
    useQuery.mockReturnValue({ fetchStatus: 'failed', data: undefined, fetch })

    const { result, rerender } = renderHook(() =>
      useQueryWithRetry(definition, options)
    )

    // Exhaust the retries
    act(() => {
      jest.advanceTimersByTime(500)
    })
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(result.current.hasError).toBe(true)

    // The query recovers
    useQuery.mockReturnValue({ fetchStatus: 'loaded', data: [], fetch })
    act(() => {
      rerender()
    })
    expect(result.current.hasError).toBe(false)

    // A later transient failure gets its own fresh retry budget
    useQuery.mockReturnValue({ fetchStatus: 'failed', data: undefined, fetch })
    act(() => {
      rerender()
    })
    expect(result.current.hasError).toBe(false)
    expect(result.current.isRetrying).toBe(true)

    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(fetch).toHaveBeenCalledTimes(4)
  })
})
