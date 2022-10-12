import { createMockClient } from 'cozy-client'
import MockDate from 'mockdate'

import { add, storeTriggerStates, isOlderThan, sub } from './helpers'

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

describe('sub', () => {
  it('returns a Date object', () => {
    expect(
      sub(Date.now(), { days: 1, hours: 2, minutes: 3, seconds: 4 })
    ).toBeInstanceOf(Date)
    expect(
      sub(new Date(), { days: 1, hours: 2, minutes: 3, seconds: 4 })
    ).toBeInstanceOf(Date)
  })

  it('returns the expected past date', () => {
    const base = Date.parse('28 Sep 2022 11:14:37 GMT')

    const past = sub(base, { days: 1, hours: 2, minutes: 3, seconds: 4 })
    expect(past.getUTCFullYear()).toBe(2022)
    expect(past.getUTCMonth()).toBe(8) // Months are 0 indexed
    expect(past.getUTCDate()).toBe(27)
    expect(past.getUTCHours()).toBe(9)
    expect(past.getUTCMinutes()).toBe(11)
    expect(past.getUTCSeconds()).toBe(33)
  })
})

describe('add', () => {
  it('returns a Date object', () => {
    expect(
      add(Date.now(), {
        days: 1,
        hours: 2,
        minutes: 3,
        seconds: 4
      })
    ).toBeInstanceOf(Date)
    expect(
      add(new Date(), {
        days: 1,
        hours: 2,
        minutes: 3,
        seconds: 4
      })
    ).toBeInstanceOf(Date)
  })

  it('returns the expected future date', () => {
    const base = Date.parse('28 Sep 2022 11:14:37 GMT')

    const future = add(base, {
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4
    })
    expect(future.getUTCFullYear()).toBe(2022)
    expect(future.getUTCMonth()).toBe(8) // Months are 0 indexed
    expect(future.getUTCDate()).toBe(29)
    expect(future.getUTCHours()).toBe(13)
    expect(future.getUTCMinutes()).toBe(17)
    expect(future.getUTCSeconds()).toBe(41)
  })
})

describe('isOlderThan', () => {
  afterEach(() => {
    MockDate.reset()
  })

  it('returns true if given date is older than given time parameters', () => {
    MockDate.set(Date.parse('28 Sep 2022 11:14:37 GMT'))

    expect(isOlderThan('2022-09-28T11:14:33Z', { seconds: 3 })).toBe(true)
  })

  it('returns false if given date is not older than given time parameters', () => {
    MockDate.set(Date.parse('28 Sep 2022 11:14:37 GMT'))

    expect(isOlderThan('2022-09-28T11:14:33Z', { seconds: 4 })).toBe(false)
  })
})
