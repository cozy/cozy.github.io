import { createMockClient } from 'cozy-client'

import { destroyTriggerAt } from './destroyTriggerAt'
import { getTriggerStates, fetchRelatedAtTriggers } from './helpers'

jest.mock('./helpers', () => ({
  ...jest.requireActual('./helpers'),
  getTriggerStates: jest.fn(),
  fetchRelatedAtTriggers: jest.fn()
}))

describe('destroyTriggerAt', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const client = createMockClient({})
  client.destroy = jest.fn()

  it('should not destroy triggers if no trigger in state', async () => {
    getTriggerStates.mockResolvedValue({})

    await destroyTriggerAt(client)
    expect(client.destroy).not.toHaveBeenCalled()
  })

  it('should not destroy triggers if no related @at trigger found', async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: { status: 'errored' }
    })
    fetchRelatedAtTriggers.mockResolvedValue([])

    await destroyTriggerAt(client)
    expect(client.destroy).not.toHaveBeenCalled()
  })

  it('should not destroy triggers if @at related triggers found are in error status', async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: { status: 'errored' }
    })
    fetchRelatedAtTriggers.mockResolvedValue([
      { type: '@at', message: { konnectorTriggerId: 'trigger01Id' } }
    ])

    await destroyTriggerAt(client)
    expect(client.destroy).not.toHaveBeenCalled()
  })

  it('should destroy triggers if @at related triggers found are not in error status', async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: { status: 'done' }
    })
    fetchRelatedAtTriggers.mockResolvedValue([
      { type: '@at', message: { konnectorTriggerId: 'trigger01Id' } }
    ])

    await destroyTriggerAt(client)
    expect(client.destroy).toHaveBeenCalled()
  })
})
