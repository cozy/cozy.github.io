// Mocking handlersbars since we don't want to test HTML rendering here and it fails in the tests context
jest.mock('handlebars')

import merge from 'lodash/merge'
import { getEnabledNotificationClasses } from './services'
import BalanceLower from './BalanceLower'
import TransactionGreater from './TransactionGreater'
import HealthBillLinked from './HealthBillLinked'

describe('getEnabledNotificationClasses', () => {
  it('should return the right classes', () => {
    const config = {
      notifications: {
        balanceLower: { enabled: true, value: 100 },
        transactionGreater: { enabled: true, value: 600 },
        healthBillLinked: { enabled: true }
      }
    }

    expect(getEnabledNotificationClasses(config)).toEqual([
      BalanceLower,
      TransactionGreater,
      HealthBillLinked
    ])

    expect(
      getEnabledNotificationClasses(
        merge(config, {
          notifications: { transactionGreater: { enabled: false } }
        })
      )
    ).toEqual([BalanceLower, HealthBillLinked])

    expect(
      getEnabledNotificationClasses(
        merge(config, {
          notifications: { transactionGreater: { value: null } }
        })
      )
    ).toEqual([BalanceLower, HealthBillLinked])

    expect(
      getEnabledNotificationClasses(
        merge(config, {
          notifications: { transactionGreater: { value: undefined } }
        })
      )
    ).toEqual([BalanceLower, HealthBillLinked])

    expect(
      getEnabledNotificationClasses(
        merge(config, {
          notifications: {
            transactionGreater: { enabled: false },
            balanceLower: { enabled: false }
          }
        })
      )
    ).toEqual([HealthBillLinked])

    expect(
      getEnabledNotificationClasses(
        merge(config, {
          notifications: {
            transactionGreater: { enabled: false },
            balanceLower: { enabled: false },
            healthBillLinked: { enabled: false }
          }
        })
      )
    ).toHaveLength(0)
  })
})
