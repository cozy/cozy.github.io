import { createMockClient } from 'cozy-client'

import { createScheduledTrigger, containerForTesting } from './createTriggerAt'
import { getTriggerStates, fetchRelatedFuturAtTriggers } from './helpers'

jest.mock('./helpers', () => ({
  ...jest.requireActual('./helpers'),
  getTriggerStates: jest.fn(),
  fetchRelatedFuturAtTriggers: jest.fn()
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

  it("should not create @at triggers if the konnector doesn't sent notification", async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: { shouldNotify: { ok: false } }
    })

    await createScheduledTrigger(client)

    expect(containerForTesting.createTriggerAt).not.toHaveBeenCalled()
  })

  it('should not create @at triggers if there are already created in the futur', async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: {
        shouldNotify: { ok: true }
      }
    })
    fetchRelatedFuturAtTriggers.mockResolvedValue([
      { type: '@at', message: { konnectorTriggerId: 'trigger01Id' } }
    ])

    await createScheduledTrigger(client)

    expect(containerForTesting.createTriggerAt).not.toHaveBeenCalled()
  })

  it('should create two @at triggers', async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: {
        shouldNotify: { ok: true }
      }
    })
    fetchRelatedFuturAtTriggers.mockResolvedValue([])

    await createScheduledTrigger(client)

    expect(containerForTesting.createTriggerAt).toHaveBeenCalledTimes(2)
  })
})
