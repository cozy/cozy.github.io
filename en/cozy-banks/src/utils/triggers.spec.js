import { merge } from 'lodash'
import { getKonnectorFromTrigger, isBankTrigger } from './triggers'

describe('getKonnectorFromTrigger', () => {
  it('should work with normal triggers', () => {
    const normalTrigger = {
      _rev: '1-31eb8f0da1db0f3196ccf0d4329ea554',
      prefix: 'toto.mycozy.cloud',
      arguments: '0 35 0 * * 3',
      message: {
        account: '4cbfe8f3d89edf60542d5fe9cdcac7b1',
        konnector: 'orangemobile'
      },
      _id: 'fa4c076914ce46a92fa3e7e5f0672ca5',
      domain: 'claire.mycozy.cloud',
      worker: 'konnector',
      debounce: '',
      options: null,
      type: '@cron'
    }
    expect(getKonnectorFromTrigger(normalTrigger)).toBe('orangemobile')
  })

  it('should work with legacy triggers', () => {
    const legacyTrigger = {
      arguments: '37 42 0 * * 3',
      domain: 'claire.mycozy.cloud',
      _rev: '2-a9f7f0eb5ccc0871e10721797ef5dcf0',
      worker: 'konnector',
      _id: '3a7c363eea2ddb4d73bd11afa9bb4691',
      type: '@cron',
      options: null,
      message: {
        Data:
          'eyJrb25uZWN0b3IiOiJhbWVsaSIsImFjY291bnQiOiIzYTdjMzYzZWVhMmRkYjRkNzNiZDExYWZhOWJiM2ViNiJ9',
        Type: 'json'
      }
    }
    expect(getKonnectorFromTrigger(legacyTrigger)).toBe('ameli')
  })
})

describe('isBankTrigger', () => {
  const trigger = {
    attributes: {
      worker: 'konnector',
      message: { konnector: 'creditcooperatif148' }
    }
  }
  const triggerNotKonnector = merge({}, trigger, {
    attributes: { worker: 'notKonnector' }
  })
  const triggerWithUnknownBank = merge({}, trigger, {
    attributes: { message: { konnector: 'unknownBank' } }
  })
  const triggerWithoutMessage = { attributes: {} }

  it('should return if is bank trigger', () => {
    expect(isBankTrigger(trigger.attributes)).toBe(true)
    expect(isBankTrigger(triggerNotKonnector.attributes)).toBe(false)
    expect(isBankTrigger(triggerWithUnknownBank.attributes)).toBe(false)
    expect(isBankTrigger(triggerWithoutMessage.attributes)).toBe(false)
  })
})
