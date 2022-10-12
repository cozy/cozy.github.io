import { createMockClient } from 'cozy-client'
import MockDate from 'mockdate'

import { shouldNotify } from './shouldNotify'
import { sub } from './helpers'

describe('shouldNotify', () => {
  const setup = ({ last_failure } = {}) => {
    const client = createMockClient({})
    client.query.mockResolvedValue({ data: {} })
    client.stackClient.fetchJSON.mockResolvedValue({
      latest_version: { manifest: { categories: ['banking'] } }
    }) // connector's registry info

    const previousStates = {
      fakeTrigger: {}
    }

    const trigger = {
      _id: 'fakeTrigger',
      message: {
        konnector: 'fakeBankingConnector'
      },
      current_state: {
        status: 'errored',
        last_error: 'LOGIN_FAILED', // actionable error
        last_success: sub(Date.now(), { days: 15 }).toISOString(), // has succeeded in the past
        last_executed_job_id: 'fakeJob',
        last_failure
      }
    }

    return { client, previousStates, trigger }
  }

  beforeEach(() => {
    MockDate.set(Date.now())
  })

  afterEach(() => {
    MockDate.reset()
  })

  describe('last failure date', () => {
    it('returns a truthy result if given trigger failed less than 7 days and 15 minutes ago', async () => {
      const { client, previousStates, trigger } = setup({
        last_failure: sub(Date.now(), {
          days: 7,
          minutes: 15
        }).toISOString()
      })

      expect(await shouldNotify({ client, trigger, previousStates })).toEqual({
        ok: true
      })
    })

    it('returns a falsy result if given trigger failed more than 7 days and 15 minutes ago', async () => {
      const { client, previousStates, trigger } = setup({
        last_failure: sub(Date.now(), {
          days: 7,
          minutes: 15,
          seconds: 1
        }).toISOString()
      })

      expect(await shouldNotify({ client, trigger, previousStates })).toEqual({
        ok: false,
        reason: 'last-failure-too-old'
      })
    })
  })
})
