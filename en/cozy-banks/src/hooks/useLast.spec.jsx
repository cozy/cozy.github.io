import useLast from './useLast'
import { renderHook } from '@testing-library/react-hooks'

describe('useLast', () => {
  it('should work', () => {
    const { result, rerender } = renderHook(
      initialValue =>
        useLast(
          initialValue,
          (lastQuery, query) =>
            !lastQuery || (!query.hasMore && query.lastUpdate)
        ),
      { initialProps: { id: 1, hasMore: true, lastUpdate: new Date() } }
    )
    expect(result.current.id).toEqual(1)
    rerender({ id: 2 }) // does not pass filter since no lastUpdate
    expect(result.current.id).toEqual(1)

    // does not pass filter since hasMore is true
    rerender({ id: 2, lastUpdate: new Date(), hasMore: true })
    expect(result.current.id).toEqual(1)
    rerender({ id: 2, lastUpdate: new Date(), hasMore: false })
    expect(result.current.id).toEqual(2)
  })
})
