import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import AccountSwitch from './AccountSwitch'

import { createMockClient } from 'cozy-client/dist/mock'

import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures'
import getClient from 'selectors/getClient'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'

const accounts = fixtures[ACCOUNT_DOCTYPE]

jest.mock('selectors/getClient', () => jest.fn())

describe('account switch', () => {
  const setup = () => {
    const client = createMockClient({
      queries: {
        accounts: {
          doctype: ACCOUNT_DOCTYPE,
          data: accounts
        },
        groups: {
          doctype: GROUP_DOCTYPE,
          data: []
        }
      }
    })
    getClient.mockReturnValue(client)
    const root = render(
      <AppLike client={client}>
        <AccountSwitch />
      </AppLike>
    )
    return { root }
  }

  it('should render correctly', async () => {
    const { root } = setup()

    const allAccounts = root.getByText('All accounts')
    expect(allAccounts).toBeTruthy()
    fireEvent.click(allAccounts)
    expect(root.getByText('Checking accounts')).toBeTruthy()
    expect(root.getByText('7 accounts')).toBeTruthy()
  })
})
