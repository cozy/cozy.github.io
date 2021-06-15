import React from 'react'
import pickBy from 'lodash/pickBy'
import { fireEvent, render } from '@testing-library/react'
import AccountSwitch from './AccountSwitch'

import { createMockClient } from 'cozy-client/dist/mock'

import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures'
import getClient from 'selectors/getClient'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'

jest.mock('selectors/getClient', () => jest.fn())

describe('account switch', () => {
  const setup = ({ accountsData, groupsData }) => {
    const client = createMockClient({
      queries: pickBy(
        {
          accounts: {
            doctype: ACCOUNT_DOCTYPE,
            data: accountsData
          },
          groups: {
            doctype: GROUP_DOCTYPE,
            data: groupsData
          }
        },
        // eslint-disable-next-line no-unused-vars
        (v, _) => v.data
      )
    })
    getClient.mockReturnValue(client)
    const root = render(
      <AppLike client={client}>
        <AccountSwitch />
      </AppLike>
    )
    return { root }
  }

  it('should render correctly when there are no groups', async () => {
    const accounts = fixtures[ACCOUNT_DOCTYPE]
    const { root } = setup({
      accountsData: accounts,
      groupsData: []
    })

    const allAccounts = root.getByText('All accounts')
    expect(allAccounts).toBeTruthy()
    fireEvent.click(allAccounts)
    expect(root.getByText('Checking accounts')).toBeTruthy()
    expect(root.getByText('7 accounts')).toBeTruthy()
  })

  it('should render correctly when groups have not been loaded', async () => {
    const accounts = fixtures[ACCOUNT_DOCTYPE]
    const { root } = setup({
      accountsData: accounts
    })

    const allAccounts = root.getByText('All accounts')
    expect(allAccounts).toBeTruthy()
    fireEvent.click(allAccounts)
    expect(root.getByText('Checking accounts')).toBeTruthy()
    expect(root.getByText('7 accounts')).toBeTruthy()
  })
})
