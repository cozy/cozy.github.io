import { getTriggersOrderByError } from './helpers'
import fixtures from 'test/fixtures'

const DEFAULT_TRIGGERS = fixtures['io.cozy.triggers']
const DEFAULT_ACCOUNTS = fixtures['io.cozy.bank.accounts']

describe('getTriggersOrderByError', () => {
  it('should order triggers by error', () => {
    const triggers = DEFAULT_TRIGGERS
    const isBankTrigger = () => true
    const result = getTriggersOrderByError({
      triggers,
      accounts: DEFAULT_ACCOUNTS,
      isBankTrigger
    })

    expect(result).toHaveLength(3)
    expect(result[0]).toBe(triggers[2])
    expect(result[1]).toBe(triggers[3])
    expect(result[2]).toBe(triggers[4])
  })

  it('should return empty array if no triggers', () => {
    const triggers = []
    const isBankTrigger = () => true
    const result = getTriggersOrderByError({
      triggers,
      accounts: DEFAULT_ACCOUNTS,
      isBankTrigger
    })

    expect(result).toHaveLength(0)
  })
})
