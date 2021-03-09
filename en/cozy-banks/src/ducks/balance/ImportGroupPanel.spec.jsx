import React from 'react'

import AppLike from 'test/AppLike'
import ImportGroupPanel from 'ducks/balance/ImportGroupPanel'

import { render } from '@testing-library/react'

import CozyClient from 'cozy-client'
import CozyRealtime from 'cozy-realtime'

jest.mock('cozy-realtime')

describe('ImportGroupPanel', () => {
  const setup = ({ jobsInProgress }) => {
    const client = new CozyClient({})
    client.query = jest.fn().mockResolvedValue({
      data: {
        attributes: {
          name: ''
        }
      }
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

  it('should displays multiple konnector in progress', () => {
    const jobsInProgress = [
      { konnector: 'caissedepargne1', account: '1111' },
      { konnector: 'boursorama83', account: '2222' }
    ]
    const { root } = setup({ jobsInProgress })

    expect(root.getByText('Import accounts')).toBeTruthy()
    expect(root.getAllByText('Import in progress').length).toEqual(2)
  })
})
