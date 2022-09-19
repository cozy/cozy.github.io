import React from 'react'

import AppLike from 'test/AppLike'
import ImportGroupPanel from 'ducks/balance/ImportGroupPanel'

import { render } from '@testing-library/react'

import CozyClient from 'cozy-client'

jest.mock('cozy-realtime')

describe('ImportGroupPanel', () => {
  const setup = ({ jobsInProgress }) => {
    const client = new CozyClient({})

    const root = render(
      <AppLike client={client} jobsInProgress={jobsInProgress}>
        <ImportGroupPanel />
      </AppLike>
    )

    return { root }
  }

  it('should not be shown', () => {
    const { root } = setup({})
    expect(root.queryByText('Import in progress')).toBeNull()
  })

  it('should displays multiple konnector in progress', async () => {
    const jobsInProgress = [
      {
        konnector: 'caissedepargne1',
        account: '1111',
        institutionLabel: 'Caisse Epargne'
      },
      {
        konnector: 'boursorama83',
        account: '2222',
        institutionLabel: 'Boursorama'
      }
    ]

    const { root } = setup({ jobsInProgress })

    expect(await root.findByText('Import accounts')).toBeTruthy()
    expect(await root.findByText('Caisse Epargne')).toBeTruthy()
    expect(await root.findByText('Boursorama')).toBeTruthy()
    const imports = await root.findAllByText('Import in progress')
    expect(imports.length).toEqual(2)
  })
})
