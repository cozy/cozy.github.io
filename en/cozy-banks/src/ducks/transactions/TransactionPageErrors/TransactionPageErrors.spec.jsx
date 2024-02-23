import React from 'react'

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { TransactionPageErrors } from './TransactionPageErrors'
import fixtures from 'test/fixtures'
import AppLike from 'test/AppLike'
import { createMockClient } from 'cozy-client'

const DEFAULT_TRIGGERS = fixtures['io.cozy.triggers']
const DEFAULT_ACCOUNTS = fixtures['io.cozy.bank.accounts']

jest.mock('ducks/context/BanksContext', () => ({
  ...jest.requireActual('ducks/context/BanksContext'),
  useBanksContext: () => ({
    isBankTrigger: () => true
  })
}))

describe('transaction page errors', () => {
  const setup = ({
    triggers = DEFAULT_TRIGGERS,
    accounts = DEFAULT_ACCOUNTS
  } = {}) => {
    const mockClient = createMockClient({
      queries: {
        'io.cozy.triggers/worker_in_konnector_client': {
          doctype: 'io.cozy.triggers',
          data: triggers
        }
      }
    })

    return render(
      <AppLike client={mockClient}>
        <TransactionPageErrors accounts={accounts} />
      </AppLike>
    )
  }

  it('should only show triggers for currently filtered accounts', () => {
    setup({
      accounts: [DEFAULT_ACCOUNTS[0]]
    })

    const nextButton = screen.queryByRole('button', { name: /next/i })
    expect(nextButton).toBeNull()
  })

  it('should wrap in a carousel if there is more than 1 trigger', () => {
    setup()

    // Check if the Carrousel is rendered
    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeInTheDocument()
  })
})
