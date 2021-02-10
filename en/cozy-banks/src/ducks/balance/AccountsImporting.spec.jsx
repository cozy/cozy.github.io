import React from 'react'
import { render } from '@testing-library/react'
import AppLike from 'test/AppLike'
import { createMockClient } from 'cozy-client'
import AccountsImporting from './AccountsImporting'

jest.mock('cozy-flags', () => flagName => {
  return flagName === 'balance.no-delay-groups'
})

const konnectorInfos = [
  {
    konnector: 'konnector',
    status: 'running'
  },
  {
    konnector: 'konnector',
    status: 'done'
  }
]

describe('Importing Accounts', () => {
  const setup = ({ konnectorInfos = [] }) => {
    const client = createMockClient({})

    const root = render(
      <AppLike client={client}>
        <AccountsImporting konnectorInfos={konnectorInfos} />
      </AppLike>
    )

    return { client, root }
  }

  it('should display checking and Saving panels', () => {
    const { root } = setup({
      konnectorInfos
    })
    expect(root.getByText('Checking accounts')).toBeTruthy()
    expect(root.getByText('Saving accounts')).toBeTruthy()
  })

  it('should display import in progress', () => {
    const { root } = setup({
      konnectorInfos
    })
    expect(root.getAllByRole('progressbar').length).toEqual(5)
    expect(root.getAllByText('Importing accounts').length).toEqual(5)
    expect(root.getByText('This may take a few minutes…')).toBeTruthy()
  })

  // In reality, it should not be displayed
  // Issue: https://github.com/cozy/cozy-banks/issues/2003
  it('should display only 2 import in progress', () => {
    const { root } = setup({
      konnectorInfos: [
        {
          konnector: 'konnector',
          status: 'done'
        }
      ]
    })

    expect(root.getAllByRole('progressbar').length).toEqual(2)
    expect(root.getAllByText('Importing accounts').length).toEqual(2)
    expect(root.queryByText('This may take a few minutes…')).toBeFalsy()
  })
})
