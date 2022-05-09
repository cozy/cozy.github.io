import React from 'react'

import AppLike from 'test/AppLike'
import ImportGroupPanel from 'ducks/balance/ImportGroupPanel'

import { render } from '@testing-library/react'

import CozyClient from 'cozy-client'
import CozyRealtime from 'cozy-realtime'

jest.mock('cozy-realtime')

describe('ImportGroupPanel', () => {
  const setup = ({ jobsInProgress, mockResolvedValue }) => {
    const client = new CozyClient({})
    client.query = jest.fn().mockResolvedValue(mockResolvedValue)
    client.queryAll = jest.fn().mockResolvedValue({
      data: [{ slug: 'caissedepargne1' }, { slug: 'boursorama83' }]
    })

    CozyRealtime.mockReturnValue({
      subscribe: () => {},
      unsubscribe: () => {}
    })

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
      { konnector: 'caissedepargne1', account: '1111' },
      { konnector: 'boursorama83', account: '2222' }
    ]
    const mockResolvedValue = {
      data: [
        {
          ...jobsInProgress[0],
          slug: jobsInProgress[0].konnector,
          name: 'Caisse Epargne'
        },
        {
          ...jobsInProgress[1],
          slug: jobsInProgress[0].konnector,
          name: 'Boursorama'
        }
      ]
    }
    const { root } = setup({ jobsInProgress, mockResolvedValue })

    expect(await root.findByText('Import accounts')).toBeTruthy()
    expect(await root.findByText('Caisse Epargne')).toBeTruthy()
    expect(await root.findByText('Boursorama')).toBeTruthy()
    const imports = await root.findAllByText('Import in progress')
    expect(imports.length).toEqual(2)
  })
})
