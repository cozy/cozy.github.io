import { createMockClient } from 'cozy-client'

import { createScheduledTrigger, containerForTesting } from './createTriggerAt'
import { fetchRelatedFuturAtTriggers, getTriggerStates, sub } from './helpers'

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

  it('should not create @at triggers if the service should not notify', async () => {
    getTriggerStates.mockResolvedValue({
      trigger01Id: { shouldNotify: { ok: false } }
    })

    await createScheduledTrigger(client)

    expect(containerForTesting.createTriggerAt).not.toHaveBeenCalled()
  })

  it('should not create @at triggers if some were already scheduled in the future', async () => {
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

  describe('when the last trigger failure occurred less than 24 hours ago', () => {
    it('should create two @at triggers', async () => {
      getTriggerStates.mockResolvedValue({
        trigger01Id: {
          shouldNotify: { ok: true },
          last_failure: sub(Date.now(), { hours: 23, minutes: 59, seconds: 59 })
        }
      })
      fetchRelatedFuturAtTriggers.mockResolvedValue([])

      await createScheduledTrigger(client)

      expect(client.save).toHaveBeenCalledTimes(2)
    })
  })

  describe('when the last trigger failure occurred less than 5 days ago', () => {
    it('should create one @at trigger', async () => {
      getTriggerStates.mockResolvedValue({
        trigger01Id: {
          shouldNotify: { ok: true },
          last_failure: sub(Date.now(), {
            days: 4,
            hours: 23,
            minutes: 59,
            seconds: 59
          })
        }
      })
      fetchRelatedFuturAtTriggers.mockResolvedValue([])

      await createScheduledTrigger(client)

      expect(client.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the last trigger failure occurred 5 days ago or more', () => {
    it('should not create @at triggers', async () => {
      getTriggerStates.mockResolvedValue({
        trigger01Id: {
          shouldNotify: { ok: true },
          last_failure: sub(Date.now(), { days: 5 })
        }
      })
      fetchRelatedFuturAtTriggers.mockResolvedValue([])

      await createScheduledTrigger(client)

      expect(client.save).toHaveBeenCalledTimes(0)
    })
  })
})
