import React from 'react'
import { render } from '@testing-library/react'
import AppLike from 'test/AppLike'
import { createMockClient } from 'cozy-client'
import AccountsImporting from './AccountsImporting'

jest.mock('components/Delayed', () => {
  return ({ children }) => children
})

jest.mock('hooks/useRedirectionURL', () => () => [
  'http://redirection',
  () => {}
])

jest.mock('cozy-flags', () => flagName => {
  return flagName === 'balance.no-delay-groups'
})

jest.mock('cozy-client', () => ({
  __esModule: true,
  ...jest.requireActual('cozy-client'),
  generateWebLink: jest.fn().mockReturnValue('http://')
}))

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
    expect(root.getAllByRole('progressbar').length).toEqual(3)
    expect(root.getAllByText('Import accounts').length).toEqual(3)
    expect(root.getByText('This may take a few minutes…')).toBeTruthy()
  })

  it('should not display import in progress', () => {
    const { root } = setup({
      konnectorInfos: [
        {
          konnector: 'konnector',
          status: 'done'
        }
      ]
    })

    expect(root.queryAllByRole('progressbar').length).toEqual(0)
    expect(root.queryByText('Import accounts')).toBeFalsy()
    expect(root.queryByText('This may take a few minutes…')).toBeFalsy()
  })
})
