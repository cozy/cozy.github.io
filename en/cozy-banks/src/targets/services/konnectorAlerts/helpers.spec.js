import { createMockClient } from 'cozy-client'
import { storeTriggerStates } from './helpers'

const triggerStatesWithNotifsInfo = [
  {
    trigger: {
      _rev: '1',
      current_state: {
        trigger_id: 'trigger1Id',
        status: 'errored'
      }
    },
    shouldNotify: { reason: 'manual-job' }
  },
  {
    trigger: {
      _rev: '1',
      current_state: {
        trigger_id: 'trigger2Id',
        status: 'errored'
      }
    },
    shouldNotify: { reason: 'last-failure-already-notified' }
  }
]

const previousDoc = { _rev: 'rev1' }

describe('storeTriggerStates', () => {
  it('should save a well formated doc', async () => {
    const client = createMockClient({})

    await storeTriggerStates(client, triggerStatesWithNotifsInfo, previousDoc)

    expect(client.save).toBeCalledWith({
      _id: 'trigger-states',
      _rev: 'rev1',
      _type: 'io.cozy.bank.settings',
      triggerStates: {
        trigger1Id: {
          shouldNotify: {
            reason: 'manual-job'
          },
          status: 'errored',
          trigger_id: 'trigger1Id'
        },
        trigger2Id: {
          shouldNotify: {
            reason: 'last-failure-already-notified'
          },
          status: 'errored',
          trigger_id: 'trigger2Id'
        }
      }
    })
  })
})
