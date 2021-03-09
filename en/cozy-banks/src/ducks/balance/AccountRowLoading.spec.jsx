import React from 'react'
import { render } from '@testing-library/react'
import AppLike from 'test/AppLike'
import { createMockClient } from 'cozy-client'
import AccountRowLoading from './AccountRowLoading'

const konnectorInfos = [
  {
    konnector: 'konnector',
    account: 'account',
    status: 'other'
  },
  {
    konnector: 'konnector',
    account: 'account',
    status: 'errored'
  }
]

describe('Account Row Loading', () => {
  const setup = k => {
    const client = createMockClient({})

    const root = render(
      <AppLike client={client}>
        <AccountRowLoading
          konnectorSlug={k.konnector}
          account={k.account}
          status={k.status}
        />
      </AppLike>
    )

    return { client, root }
  }

  it('should progress with any status', () => {
    const { root } = setup(konnectorInfos[0])
    expect(root.getByText('Import accounts')).toBeTruthy()
    expect(root.getByText('In progress')).toBeTruthy()
    expect(root.getByRole('progressbar')).toBeTruthy()
  })

  it('should display when konnector has errored status', () => {
    const { root } = setup(konnectorInfos[1])
    expect(root.getByText('Failed to import')).toBeTruthy()
    expect(root.getByText('Click to restart')).toBeTruthy()
  })
})
