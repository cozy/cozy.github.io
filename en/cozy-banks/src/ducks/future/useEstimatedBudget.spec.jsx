import React from 'react'
import { createMockClient } from 'cozy-client/dist/mock'
import fixtures from 'test/fixtures'
import AppLike from 'test/AppLike'
import { renderHook } from '@testing-library/react-hooks'
import {
  RECURRENCE_DOCTYPE,
  TRANSACTION_DOCTYPE,
  ACCOUNT_DOCTYPE
} from 'doctypes'
import useEstimatedBudget from './useEstimatedBudget'
import getClient from 'selectors/getClient'
import { getFilteredAccountIds } from 'ducks/filters'
import { nextDate } from 'ducks/recurrence'
import addDays from 'date-fns/add_days'

jest.mock('ducks/recurrence', () => {
  return {
    ...jest.requireActual('ducks/recurrence'),
    nextDate: jest.fn()
  }
})

jest.mock('ducks/filters', () => {
  return {
    ...jest.requireActual('ducks/filters'),
    getFilteredAccountIds: jest.fn()
  }
})
jest.mock('selectors/getClient', () => jest.fn())

describe('useEstimatedBudget', () => {
  it('should work', () => {
    getFilteredAccountIds.mockReturnValue(['compteisa1'])
    const client = createMockClient({
      queries: {
        accounts: {
          doctype: ACCOUNT_DOCTYPE,
          data: fixtures['io.cozy.bank.accounts']
        },
        recurrence: {
          doctype: RECURRENCE_DOCTYPE,
          data: fixtures['io.cozy.bank.recurrence']
        },
        transactions: {
          doctype: TRANSACTION_DOCTYPE,
          data: fixtures['io.cozy.bank.operations'].filter(x => x._id)
        }
      }
    })
    nextDate.mockReturnValue(addDays(new Date(), 15))
    getClient.mockReturnValue(client)
    const wrapper = ({ children }) => (
      <AppLike client={client}>{children}</AppLike>
    )
    const { result } = renderHook(() => useEstimatedBudget(), { wrapper })
    expect(result.current).toEqual({
      isLoading: false,
      estimatedBalance: 47833.45,
      sumTransactions: 3870.54,
      currency: undefined,
      transactions: [
        expect.objectContaining({
          _type: 'io.cozy.bank.operations',
          label: 'Salaire juin',
          amount: 3870.54,
          date: expect.any(String),
          account: 'compteisa1',
          manualCategoryId: '200110',
          automaticCategoryId: '200110'
        })
      ]
    })
  })
})
