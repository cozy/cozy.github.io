import useRealtime from './useRealtime'
import { renderHook } from '@testing-library/react-hooks'

it('should subscribe to realtime events according to given specs', () => {
  const onCreateOrUpdate = jest.fn()

  const specs = {
    'io.cozy.apps': {
      created: onCreateOrUpdate
    },
    'io.cozy.contacts': {
      updated: onCreateOrUpdate
    }
  }

  const mockClient = {
    plugins: {
      realtime: {
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        unsubscribeAll: jest.fn()
      }
    }
  }

  renderHook(() => useRealtime(mockClient, specs, []))

  expect(mockClient.plugins.realtime.subscribe).toHaveBeenNthCalledWith(
    1,
    'created',
    'io.cozy.apps',
    onCreateOrUpdate
  )

  expect(mockClient.plugins.realtime.subscribe).toHaveBeenNthCalledWith(
    2,
    'updated',
    'io.cozy.contacts',
    onCreateOrUpdate
  )
})
