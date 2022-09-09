import { createMockClient } from 'cozy-client/dist/mock'
import fixtures from 'test/fixtures'
import {
  RECURRENCE_DOCTYPE,
  TRANSACTION_DOCTYPE,
  ACCOUNT_DOCTYPE
} from 'doctypes'
import { getAccounts } from 'selectors'
import { getTransactions } from './index'
import getClient from './getClient'

jest.mock('ducks/filters', () => {
  return {
    ...jest.requireActual('ducks/filters'),
    getFilteredAccountIds: jest.fn()
  }
})
jest.mock('./getClient')

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

describe('getTransactions selectors', () => {
  const doctype = TRANSACTION_DOCTYPE
  let state = {
    cozy: { documents: { [doctype]: { a: { label: 1 }, b: 2 } } }
  }
  const reducer = (state, action) => ({
    cozy: {
      documents: {
        [doctype]: action(state.cozy.documents[doctype])
      }
    }
  })
  const id = x => x

  it('should filter / hydrate documents', () => {
    getClient.mockReturnValue({
      hydrateDocuments: (doctype, docs) => [...docs]
    })

    state = reducer(state, id)
    expect(getTransactions(state)).toEqual([{ label: 1 }])
    expect(getTransactions.recomputations()).toEqual(1)
  })
})
