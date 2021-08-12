import React from 'react'
import CozyClient from 'cozy-client'
import { render, act } from '@testing-library/react'
import AppLike from 'test/AppLike'
import PinSettings from './PinSettings'

const getCheckbox = root => {
  const container = root.getByLabelText(
    'Lock my app with a pin code or a fingerprint. Unlocking will be required after 1 minute of inactivity.'
  )
  return container.querySelector('input')
}

describe('PinSettings', () => {
  const setup = async ({ pinDoc }) => {
    const client = new CozyClient()
    client.stackClient.fetchJSON = async (method, route) => {
      if (method === 'GET' && route === '/data/io.cozy.bank.settings/pin') {
        if (pinDoc) {
          return pinDoc
        } else {
          throw new Error('not_found')
        }
      } else {
        throw new Error('Unsupported route for mocked fetchJSON')
      }
    }
    const root = render(
      <AppLike client={client}>
        <PinSettings />
      </AppLike>
    )

    // Wait for queries to be resolved
    await act(async () => {})

    return { root }
  }

  it('should render an unchecked switch by default', async () => {
    const { root } = await setup({
      pinDoc: null
    })
    expect(getCheckbox(root).checked).toBe(false)
  })

  it('should render a checked switch by default', async () => {
    const { root } = await setup({
      pinDoc: { _id: 'pin', pin: '1234' }
    })
    expect(getCheckbox(root).checked).toBe(true)
  })

  it('should render an unchecked switch if pin has been removed', async () => {
    const { root } = await setup({
      pinDoc: { _id: 'pin' }
    })
    expect(getCheckbox(root).checked).toBe(false)
  })
})
