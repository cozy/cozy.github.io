import merge from 'lodash/merge'
import { isBankTrigger } from './triggers'

describe('isBankTrigger', () => {
  const trigger = {
    attributes: {
      worker: 'konnector',
      message: { konnector: 'creditcooperatif148' }
    }
  }
  const triggerWithUnknownBank = merge({}, trigger, {
    attributes: { message: { konnector: 'unknownBank' } }
  })
  const triggerWithoutMessage = { attributes: {} }

  it('should return if is bank trigger', () => {
    expect(isBankTrigger(trigger.attributes)).toBe(true)
    expect(isBankTrigger(triggerWithUnknownBank.attributes)).toBe(false)
    expect(isBankTrigger(triggerWithoutMessage.attributes)).toBe(false)
  })
})
