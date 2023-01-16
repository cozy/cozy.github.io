import React from 'react'
import { Route, Routes } from 'react-router-dom'

import SearchPage from './SearchPage'
import { render, act } from '@testing-library/react'
import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures/demo'
import { createMockClient } from 'cozy-client/dist/mock'
import { TRANSACTION_DOCTYPE } from 'doctypes'
import getClient from 'selectors/getClient'

// Mock debounce since we need to run the search synchronously here
// jest.useFakeTimers() does not work well with lodash/debounce
jest.mock('lodash/debounce', () => fn => fn)

jest.mock('components/BackButton', () => () => null)
jest.mock('components/Bar', () => ({
  BarLeft: ({ children }) => children,
  BarCenter: ({ children }) => children,
  BarRight: ({ children }) => children,
  BarTheme: ({ children }) => children,
  BarSearch: ({ children }) => children
}))
jest.mock('selectors/getClient', () => jest.fn())

// eslint-disable-next-line no-console
console.warn = jest.fn()

describe('SearchPage', () => {
  const setup = ({ initialEntries } = {}) => {
    const client = createMockClient({
      queries: {
        'transactions-searchPage': {
          doctype: TRANSACTION_DOCTYPE,
          data: fixtures[TRANSACTION_DOCTYPE]
        }
      }
    })

    getClient.mockReturnValue(client)
    const root = render(
      <AppLike client={client} initialEntries={initialEntries}>
        <Routes>
          <Route path="search/:search" element={<SearchPage />} />
        </Routes>
        <SearchPage />
      </AppLike>
    )

    return {
      root,
      client
    }
  }

  it('should show a page with advice on how to search', () => {
    const { root } = setup()
    expect(
      root.getByText('Type something to search a transaction')
    ).toBeTruthy()
  })

  it('should perform a search when there is a search param', () => {
    const { root } = setup({ initialEntries: ['/search/Martin'] })

    expect(root.getByText('3 results')).toBeTruthy()
    expect(root.getByText('Docteur Martoni')).toBeTruthy()
  })

  it('should update search results when a transaction is updated', () => {
    const { root, client } = setup({ initialEntries: ['/search/Martin'] })

    const originalTransaction = fixtures[TRANSACTION_DOCTYPE].find(
      x => x._id === 'paiement_docteur_martoni'
    )

    act(() => {
      client.setData({
        [TRANSACTION_DOCTYPE]: [
          {
            ...originalTransaction,
            _type: TRANSACTION_DOCTYPE,
            label: 'Docteur Martini'
          }
        ]
      })
    })

    expect(root.getByText('3 results')).toBeTruthy()
    expect(root.getByText('Docteur Martini')).toBeTruthy()
  })
})
