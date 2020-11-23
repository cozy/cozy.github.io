import { createMockClient } from 'cozy-client/dist/mock'
import fixtures from 'test/fixtures'
import {
  RECURRENCE_DOCTYPE,
  TRANSACTION_DOCTYPE,
  ACCOUNT_DOCTYPE
} from 'doctypes'
import { getAccounts } from 'selectors'

jest.mock('ducks/filters', () => {
  return {
    ...jest.requireActual('ducks/filters'),
    getFilteredAccountIds: jest.fn()
  }
})
jest.mock('selectors/getClient', () => jest.fn())

describe('getAccounts', () => {
  it('should work', () => {
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
    expect(getAccounts(client.store.getState()).length).toBe(7)
  })
})
