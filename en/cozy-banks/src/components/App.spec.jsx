import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { render, fireEvent, wait } from '@testing-library/react'

import App from 'components/App'
import AppLike from 'test/AppLike'
import Links from 'ducks/client/links'

import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import CozyClient from 'cozy-client'
import CozyLink from 'cozy-client/dist/CozyLink'

// Mock otherwise we have a fetch is not defined error
// due to pouchdb-browser. Here we are not concerned with this
// component
jest.mock('cozy-pouch-link', () => () => null)
jest.mock('components/AppSearchBar', () => () => null)
jest.mock('ducks/commons/Nav', () => () => null)
jest.mock('lodash/throttle', () => ({
  default: jest.fn(fn => fn),
  __esModule: true
}))

jest.mock('ducks/client/links', () => ({
  isActivatePouch: jest.fn()
}))

const DumbComponent = ({ client }) => {
  const fetch = async () => await client.query({ doctype: 'io.cozy.fake' })
  return <button onClick={fetch}>Fetch</button>
}

describe('App', () => {
  const requestHandler = jest.fn()
  const link = new CozyLink(requestHandler)
  beforeEach(() => {
    jest.spyOn(Alerter, 'info')
  })

  const setup = () => {
    const client = new CozyClient({ links: [link] })
    jest.spyOn(client, 'queryAll').mockResolvedValue([])
    const root = render(
      <AppLike client={client}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<DumbComponent client={client} />} />
          </Route>
        </Routes>
      </AppLike>
    )

    return root
  }

  describe('App', () => {
    it('should no show error if pouch is activated', async () => {
      const error = new TypeError('Failed to fetch')
      requestHandler.mockReturnValue(Promise.reject(error))

      Links.isActivatePouch = jest.fn().mockImplementation(() => true)

      const root = setup()

      fireEvent.click(root.getByText('Fetch'))

      await wait(() => {
        expect(Alerter.info).not.toHaveBeenCalled()
      })
    })

    it('should show an alert and reload page when a request failed', async () => {
      Object.defineProperty(window, 'location', {
        value: { reload: jest.fn() }
      })
      const error = new TypeError('Failed to fetch')
      requestHandler.mockReturnValue(Promise.reject(error))

      Links.isActivatePouch = jest.fn().mockImplementation(() => false)

      const root = setup()

      fireEvent.click(root.getByText('Fetch'))

      await wait(() => {
        expect(Alerter.info).toHaveBeenCalled()

        const msg = Alerter.info.mock.calls[0][0]
        expect(msg).toBe(
          'Connection lost. Try again later or verify your connection and reload the page.'
        )

        fireEvent.click(root.getAllByText('Reload')[0])
        expect(window.location.reload).toHaveBeenCalled()
      })
    })
  })
})
