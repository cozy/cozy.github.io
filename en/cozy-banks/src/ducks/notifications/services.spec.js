// Mocking handlersbars since we don't want to test HTML rendering here and it fails in the tests context
jest.mock('handlebars')

import CozyClient from 'cozy-client'
import merge from 'lodash/merge'
import {
  getEnabledNotificationClasses,
  sendNotifications,
  fetchTransactionAccounts
} from './services'
import BalanceLower from './BalanceLower'
import TransactionGreater from './TransactionGreater'
import HealthBillLinked from './HealthBillLinked'
import { BankAccount } from 'models'
import { sendNotification } from 'cozy-notifications'
import logger from 'cozy-logger'

jest.mock('cozy-logger', () => {
  const logger = jest.fn()
  logger.namespace = () => logger
  return logger
})

jest.mock('cozy-notifications', () => {
  const mod = jest.requireActual('cozy-notifications')
  return {
    ...mod,
    sendNotification: jest.fn()
  }
})

beforeEach(() => {
  logger.mockReset()
})

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

const mockEnvForEachTest = values => {
  let prev = {}

  beforeEach(() => {
    Object.entries(values).forEach(([name, value]) => {
      prev[name] = process.env[name]
      process.env[name] = value
    })
  })

  afterEach(() => {
    Object.entries(values).forEach(([name]) => {
      process.env[name] = prev[name]
    })
  })
}

describe('service', () => {
  beforeEach(() => {
    jest
      .spyOn(BankAccount, 'getAll')
      .mockReturnValue([
        { _id: 'c0ffeedeadbeef', label: 'My bank account', balance: 123 }
      ])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  mockEnvForEachTest({
    COZY_URL: 'http://localhost:8080',
    COZY_CREDENTIALS: 'fake-token'
  })

  it('should correctly send a notification', async () => {
    const transactions = [
      { account: 'c0ffeedeadbeef', label: 'My transaction' }
    ]
    const config = {
      notifications: {
        healthBillLinked: { enabled: true }
      }
    }
    await sendNotifications(config, transactions)
    expect(sendNotification).toHaveBeenCalledWith(
      expect.any(CozyClient),
      expect.any(HealthBillLinked)
    )
  })
})

describe('fetch transaction accounts', () => {
  beforeEach(() => {
    jest
      .spyOn(BankAccount, 'getAll')
      .mockReturnValue([
        { _id: 'c0ffeedeadbeef', label: 'My bank account', balance: 123 }
      ])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should report unknown accounts', async () => {
    const transactions = [
      { account: 'c0ffeedeadbeef', label: 'My transaction' },
      { account: 'unknown-account', label: 'My transaction 2' }
    ]
    await fetchTransactionAccounts(transactions)
    expect(logger).toHaveBeenCalledWith(
      'warn',
      '1 account(s) do not exist (ids: unknown-account)'
    )
  })
})
