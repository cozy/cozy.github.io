import React from 'react'
import { createMockClient } from 'cozy-client/dist/mock'
import { act, fireEvent, render } from '@testing-library/react'
import AccountsSettings from './AccountsSettings'
import {
  ACCOUNT_DOCTYPE as BANK_ACCOUNT_DOCTYPE,
  konnectorTriggersConn,
  accountsConn,
  schema,
  TRIGGER_DOCTYPE
} from 'doctypes'
import AppLike from 'test/AppLike'
import { receiveMutationResult } from 'cozy-client/dist/store'
// Needed to prevent unwanted updates (async component)
// Otherwise we have an error "Warning: An update to StoreLink inside a test was not wrapped in act"
jest.mock('hooks/useRedirectionURL', () => {
  return () => ['https://cozy.tools:8080', () => {}]
})

jest.mock('cozy-client', () => ({
  ...jest.requireActual('cozy-client'),
  useAppsInMaintenance: jest.fn().mockReturnValue([{ slug: 'banking-slug' }]),
  generateWebLink: jest.fn().mockReturnValue('http://')
}))

const BreakContext = () => {
  const ctx = React.createContext({
    isMobile: false
  })
  return React.useContext(ctx)
}

jest.mock('cozy-ui/transpiled/react/providers/Breakpoints', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(BreakContext),
  BreakpointsProvider: ({ children }) => children
}))

const mockBankAccounts = [
  {
    _id: 'my-bank-account1',
    shortLabel: 'My bank account 1',
    institutionName: 'My bank',
    relationships: {
      connection: {
        data: { _id: 'connection-1', doctype: 'io.cozy.accounts' }
      }
    },
    cozyMetadata: {
      createdByApp: 'caissedepargne1'
    }
  },
  {
    _id: 'my-bank-account2',
    shortLabel: 'My bank account 2',
    institutionLabel: 'My Bank',
    relationships: {
      connection: {
        data: { _id: 'connection-1', doctype: 'io.cozy.accounts' }
      }
    },
    cozyMetadata: {
      createdByApp: 'caissedepargne1'
    }
  },
  {
    _id: 'my-bank-account3',
    shortLabel: 'My bank account 3',
    institutionLabel: 'My Bank 2',
    relationships: {
      connection: {
        data: { _id: 'connection-2', doctype: 'io.cozy.accounts' }
      }
    },
    cozyMetadata: {
      createdByApp: 'caissedepargne1'
    }
  },

  // This account represents a legacy account which does not have
  // the connection relationship
  {
    _id: 'my-bank-account4',
    shortLabel: 'My bank account 4',
    institutionLabel: 'My Bank 3',
    cozyMetadata: {
      createdByApp: 'revolut'
    }
  }
]

const mockKonnectorTriggers = [
  {
    _id: 'trigger1',
    current_state: {
      status: 'errored'
    },
    message: {
      konnector: 'banking-slug'
    }
  }
]

describe('AccountsSettings', () => {
  let originalWarn
  beforeEach(() => {
    // eslint-disable-next-line no-console
    originalWarn = console.warn
    // eslint-disable-next-line no-console
    console.warn = function (msg) {
      if (
        // Ignore this warning as it is expected, since we have a
        // io.cozy.bank.accounts that has a relationship to a "deleted"
        // io.cozy.accounts.
        msg.includes(
          'getDocumentFromSlice: io.cozy.accounts:connection-2 is absent'
        )
      ) {
        return
      } else {
        originalWarn.apply(this, arguments)
      }
    }
  })

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.warn = originalWarn
  })

  const setup = () => {
    const client = new createMockClient({
      clientOptions: {
        schema: schema
      },
      queries: {
        connections: {
          doctype: 'io.cozy.accounts',
          data: [
            {
              _id: 'connection-1',
              auth: { identifier: 'mylogin' },
              account_type: 'banking-slug'
            }
          ]
        },
        [accountsConn.as]: {
          doctype: BANK_ACCOUNT_DOCTYPE,
          ...accountsConn,
          lastUpdate: new Date(),
          data: mockBankAccounts
        },
        [konnectorTriggersConn.as]: {
          doctype: TRIGGER_DOCTYPE,
          ...konnectorTriggersConn,
          lastUpdate: new Date(),
          data: mockKonnectorTriggers
        }
      }
    })
    client.intents = {
      getRedirectionURL: () => ''
    }

    client.plugins = {
      realtime: {
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      }
    }
    client.dispatch = jest.fn()

    const root = render(
      <AppLike client={client}>
        <AccountsSettings />
      </AppLike>
    )

    return { client, root }
  }

  it('should display all "connections"', () => {
    const { root } = setup()
    expect(() => root.getByText('My Bank')).not.toThrow()
    expect(() => root.getByText('My Bank 2')).not.toThrow()
    expect(() => root.getByText('My Bank 3')).not.toThrow()
  })

  it('should display an edition modal on click', async () => {
    const { root, client } = setup()
    const myLoginLine = await root.getByText('My Bank 2')

    fireEvent.click(myLoginLine)
    expect(() => root.getByText('My Bank Account 3')).not.toThrow()
    const bankAccount3 = mockBankAccounts.find(
      x => x.shortLabel === 'My bank account 3'
    )

    act(() => {
      client.store.dispatch(
        receiveMutationResult(accountsConn.as, {
          data: [
            {
              ...bankAccount3,
              id: bankAccount3._type,
              _type: BANK_ACCOUNT_DOCTYPE,
              _deleted: true
            }
          ]
        })
      )
    })
    expect(() => root.getByText('No contracts anymore')).not.toThrow()
  })

  it('should display konnector in maintenance', async () => {
    const { root } = setup()
    expect(root.getByText('In maintenance')).toBeTruthy()
  })

  it('should display an icon error', async () => {
    const { root } = setup()
    expect(root.findByTestId('error-konn')).toBeTruthy()
  })
})
