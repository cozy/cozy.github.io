import { renderHook, act } from '@testing-library/react-hooks'

import useFlag from './useFlag'
import flag from './'

describe('useFlag', () => {
  it('returns the flag value', () => {
    flag('test', 1)
    const { result } = renderHook(() => useFlag('test'))
    expect(result.current).toBe(1)
  })

  it('rerenders when the flag changes', () => {
    flag('test', 1)
    const { result } = renderHook(() => useFlag('test'))
    act(() => {
      flag('test', 2)
    })
    expect(result.current).toBe(2)
  })
})
