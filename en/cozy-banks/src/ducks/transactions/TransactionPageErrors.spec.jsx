/* global shallow */

import React from 'react'
import {
  DumbTransactionPageErrors as TransactionPageErrors,
  getDerivedData
} from './TransactionPageErrors'
import fixtures from 'test/fixtures'
import TriggerErrorCard from 'ducks/transactions/TriggerErrorCard'
import Carrousel from 'components/Carrousel'
import flag from 'cozy-flags'

jest.mock('cozy-flags')

const DEFAULT_TRIGGERS = fixtures['io.cozy.triggers']
const DEFAULT_ACCOUNTS = fixtures['io.cozy.bank.accounts']

describe('get derived data', () => {
  it('should work', () => {
    const data = getDerivedData({
      accounts: DEFAULT_ACCOUNTS,
      triggerCol: { data: DEFAULT_TRIGGERS }
    })
    expect(data.failedTriggers.length).toBe(1)
  })
})

describe('transaction page errors', () => {
  const setup = ({
    triggers = DEFAULT_TRIGGERS,
    accounts = DEFAULT_ACCOUNTS
  } = {}) => {
    const instance = shallow(
      <TransactionPageErrors
        accounts={accounts}
        triggerCol={{ data: triggers }}
      />
    )
    return {
      instance
    }
  }

  beforeEach(() => {
    flag.mockImplementation(key => {
      if (key === 'transactions.error-banner') {
        return true
      }

      return false
    })
  })

  it('should only show errors for currently filtered accounts', () => {
    const { instance } = setup()
    expect(instance.find(TriggerErrorCard).length).toBe(1)
    expect(instance.find(Carrousel).length).toBe(0)
  })

  it('should wrap in a carousel if there is more than 1 error', () => {
    const { instance } = setup({
      triggers: [...DEFAULT_TRIGGERS, ...DEFAULT_TRIGGERS]
    })
    expect(instance.find(Carrousel).length).toBe(1)
    expect(instance.find(TriggerErrorCard).length).toBe(2)
  })
})
