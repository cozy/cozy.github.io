import { render, act } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client/dist/mock'
import flag from 'cozy-flags'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'

import { Applications } from './Applications'

import AppLike from '@/test/AppLike'

jest.mock('cozy-flags', () => {
  return jest.fn().mockReturnValue(null)
})

const setup = ({ queries, shortcuts } = {}) => {
  const client = createMockClient({
    queries: queries || {
      'io.cozy.apps': {
        lastUpdate: new Date(),
        data: [],
        doctype: 'io.cozy.apps',
        hasMore: false
      }
    }
  })

  if (shortcuts) {
    // useFetchHomeShortcuts reads the shortcuts from the included files
    // of the /Settings/Home folder.
    client.collection = jest.fn().mockReturnValue({
      statByPath: jest.fn().mockResolvedValue({ included: shortcuts })
    })
  }

  const root = render(
    <AppLike client={client} store={client.store}>
      <CozyTheme>
        <Applications />
      </CozyTheme>
    </AppLike>
  )
  return { root }
}

describe('Applications', () => {
  it('has no log out button', () => {
    const { root } = setup()
    expect(root.queryByText('Log out')).toBeFalsy()
  })

  it('has a log out button when the right flag is active', () => {
    flag.mockImplementation(flagName => {
      if (flagName === 'home.mainlist.show-logout') return true
      else return null
    })
    const { root } = setup()
    expect(root.getByText('Log out')).toBeTruthy()
  })

  it('displays retrieved shortcuts', async () => {
    const shortcuts = [
      { id: '1', name: 'toto.txt', class: 'shortcut' },
      { id: '2', name: 'tata.txt', class: 'shortcut' }
    ]
    const { root } = setup({
      shortcuts,
      queries: {
        'io.cozy.apps': {
          lastUpdate: new Date(),
          data: [],
          doctype: 'io.cozy.apps',
          hasMore: false
        }
      }
    })

    // This is necessary since there are asynchronous effects in the
    // shortcut tile
    await act(async () => {})
    expect(root.getByText('toto.txt')).toBeTruthy()
    expect(root.getByText('tata.txt')).toBeTruthy()
  })
})
