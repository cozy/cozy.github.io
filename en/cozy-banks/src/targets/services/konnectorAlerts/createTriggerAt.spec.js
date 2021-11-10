import { createMockClient } from 'cozy-client'

import { createScheduledTrigger, containerForTesting } from './createTriggerAt'
import { getTriggerStates, fetchRelatedAtTriggers } from './helpers'

jest.mock('./helpers', () => ({
  ...jest.requireActual('./helpers'),
  getTriggerStates: jest.fn(),
  fetchRelatedAtTriggers: jest.fn()
}))

jest.spyOn(containerForTesting, 'createTriggerAt')

describe('createTriggerAt', () => {
  const client = createMockClient({})

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not create @at triggers if no trigger in state', async () => {
    getTriggerStates.mockResolvedValue({})

    await createScheduledTrigger(client)

    expect(containerForTesting.createTriggerAt).not.toHaveBeenCalled()
  })

  it("should not create @at triggers if the konnector doesn't match last-failure-already-notified condition", async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: { shouldNotify: { reason: 'error-not-actionable' } }
    })

    await createScheduledTrigger(client)

    expect(containerForTesting.createTriggerAt).not.toHaveBeenCalled()
  })

  it('should not create @at triggers if there are already created', async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: {
        shouldNotify: { reason: 'last-failure-already-notified' }
      }
    })
    fetchRelatedAtTriggers.mockResolvedValue([
      { type: '@at', message: { konnectorTriggerId: 'trigger01Id' } }
    ])

    await createScheduledTrigger(client)

    expect(containerForTesting.createTriggerAt).not.toHaveBeenCalled()
  })

  it('should not create @at triggers if the konnector status is not errored ', async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: {
        shouldNotify: { reason: 'last-failure-already-notified' },
        status: 'done'
      }
    })
    fetchRelatedAtTriggers.mockResolvedValue([])

    await createScheduledTrigger(client)

    expect(containerForTesting.createTriggerAt).not.toHaveBeenCalled()
  })

  it('should create two @at triggers', async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: {
        shouldNotify: { reason: 'last-failure-already-notified' },
        status: 'errored'
      }
    })
    fetchRelatedAtTriggers.mockResolvedValue([])

    await createScheduledTrigger(client)

    expect(containerForTesting.createTriggerAt).toHaveBeenCalledTimes(2)
  })
})
