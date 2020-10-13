import CozyClient from 'cozy-client'
import { sendNotification } from 'cozy-notifications'

import matchAll from 'utils/matchAll'
import { sendTriggerNotifications } from './konnectorAlerts'

jest.mock('cozy-notifications', () => {
  const notifications = jest.requireActual('cozy-notifications')
  return {
    ...notifications,
    sendNotification: jest
      .fn()
      .mockImplementation(notifications.sendNotification)
  }
})

jest.mock('cozy-ui/transpiled/react/AppLinker', () => ({
  generateUniversalLink: () => 'universal-link'
}))

const mockTriggersResponse = {
  data: [
    {
      _id: 'trigger-1',
      attributes: {
        worker: 'konnector'
      },
      current_state: {
        status: 'errored',
        last_executed_job_id: 'job-1',
        last_error: 'LOGIN_FAILED'
      },
      message: {
        konnector: 'konnector-1'
      }
    },

    // Trigger was not in actionable error before, now the error is
    // actionable, we can send a notification
    {
      _id: 'trigger-2',
      attributes: {
        worker: 'konnector'
      },
      current_state: {
        status: 'errored',
        last_executed_job_id: 'job-2',
        last_error: 'LOGIN_FAILED'
      },
      message: {
        konnector: 'konnector-2'
      }
    },

    // Trigger in success, no notification
    {
      _id: 'trigger-3',
      attributes: {
        worker: 'konnector'
      },
      current_state: {
        status: 'success',
        last_executed_job_id: 'job-3',
        last_error: 'LOGIN_FAILED'
      },
      message: {
        konnector: 'konnector-3'
      }
    },

    // Previous error is actionable, no notification
    {
      _id: 'trigger-4',
      attributes: {
        worker: 'konnector'
      },
      current_state: {
        status: 'errored',
        last_executed_job_id: 'job-4',
        last_error: 'LOGIN_FAILED'
      },
      message: {
        konnector: 'konnector-4'
      }
    },

    // No previous state, no notification
    {
      _id: 'trigger-5',
      attributes: {
        worker: 'konnector'
      },
      current_state: {
        status: 'errored',
        last_executed_job_id: 'job-5',
        last_error: 'LOGIN_FAILED'
      },
      message: {
        konnector: 'konnector-5'
      }
    }
  ]
}

const mockSettingsResponse = {
  data: {
    triggerStates: {
      'trigger-1': {
        status: 'done',
        error: null
      },
      'trigger-2': {
        status: 'errored',
        error: 'VENDOR_DOWN'
      },
      'trigger-3': {
        status: 'done'
      },
      'trigger-4': {
        status: 'errored',
        error: 'LOGIN_FAILED'
      }
    }
  }
}

const mockJobResponse = {
  'job-1': {
    data: { manual_execution: false }
  },
  'job-2': {
    data: { manual_execution: false }
  },
  'job-3': {
    data: { manual_execution: false }
  },
  'job-4': {
    data: { manual_execution: true }
  }
}

describe('job notifications service', () => {
  const setup = ({ triggersResponse, settingsResponse, jobsResponse } = {}) => {
    const client = new CozyClient({})
    client.query = async queryDef => {
      const { doctype, id } = queryDef
      if (doctype === 'io.cozy.triggers') {
        return triggersResponse || mockTriggersResponse
      } else if (doctype === 'io.cozy.bank.settings') {
        return settingsResponse || mockSettingsResponse
      } else if (doctype === 'io.cozy.jobs' && id) {
        return jobsResponse ? jobsResponse[id] : mockJobResponse[id]
      } else {
        throw new Error(`No mock for queryDef ${queryDef}`)
      }
    }
    client.save = jest.fn()
    client.stackClient.fetchJSON = jest
      .fn()
      .mockImplementation((verb, route) => {
        if (verb === 'GET' && /\/registry\/konnector-.*/.exec(route)) {
          return { latest_version: { manifest: { categories: ['banking'] } } }
        } else if (verb === 'POST' && route === '/notifications') {
          return {}
        } else {
          throw new Error(`Mock stackClient does not support ${verb}:${route}`)
        }
      })
    client.stackClient.uri = 'http://cozy.tools:8080'
    return { client }
  }

  beforeEach(() => {
    sendNotification.mockClear()
  })

  const expectTriggerStatesToHaveBeenSaved = client => {
    const saveCalls = client.save.mock.calls
    const triggerStatesDoc = saveCalls[saveCalls.length - 1][0]
    expect(triggerStatesDoc).toEqual(
      expect.objectContaining({
        triggerStates: expect.objectContaining({
          'trigger-1': expect.any(Object),
          'trigger-2': expect.any(Object),
          'trigger-3': expect.any(Object),
          'trigger-4': expect.any(Object)
        })
      })
    )
  }

  it('should not send notifications when no trigger state has been saved yet', async () => {
    const { client } = setup({
      settingsResponse: {
        data: null
      }
    })
    await sendTriggerNotifications(client)
    expect(sendNotification).not.toHaveBeenCalled()
    expectTriggerStatesToHaveBeenSaved(client)
  })

  it('should send a notification with the right content and save trigger states', async () => {
    const { client } = setup()
    await sendTriggerNotifications(client)
    expect(sendNotification).toHaveBeenCalledTimes(1)
    expect(sendNotification).toHaveBeenCalledWith(client, expect.any(Object))

    const calls = client.stackClient.fetchJSON.mock.calls
    const payload = calls[calls.length - 1][2]
    const notifAttributes = payload.data.attributes
    const at = new Date(notifAttributes.at)
    const now = new Date()
    // test that the notification in less than a day
    const interval = +at - now
    expect(interval).toBeGreaterThan(0)
    expect(interval).toBeLessThan(86400000)

    const notifSlugs = matchAll(notifAttributes.content, /konnector-\d+/)
    expect(notifSlugs).toEqual(['konnector-1', 'konnector-2'])

    expectTriggerStatesToHaveBeenSaved(client)
  })
})
