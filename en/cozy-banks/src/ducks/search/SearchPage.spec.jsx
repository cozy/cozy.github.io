import React from 'react'
import SearchPage from './SearchPage'
import { render } from '@testing-library/react'
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

describe('SearchPage', () => {
  const setup = ({ router: routerOption } = {}) => {
    const defaultRouter = {
      params: {}
    }
    const router = routerOption || defaultRouter
    const client = createMockClient({
      queries: {
        transactions: {
          doctype: TRANSACTION_DOCTYPE,
          data: fixtures[TRANSACTION_DOCTYPE]
        }
      }
    })

    getClient.mockReturnValue(client)
    const root = render(
      <AppLike client={client} router={router}>
        <SearchPage />
      </AppLike>
    )

    return {
      root
    }
  }

  it('should show a page with advice on how to search', () => {
    const { root } = setup()
    expect(
      root.getByText('Type something to search a transaction')
    ).toBeTruthy()
  })

  it('should perform a search when there is a search param', () => {
    const { root } = setup({
      router: {
        params: {
          search: 'Martin'
        }
      }
    })

    expect(root.getByText('3 results')).toBeTruthy()
    expect(root.getByText('Docteur Martoni')).toBeTruthy()
  })
})
