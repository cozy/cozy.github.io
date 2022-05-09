import React from 'react'
import CozyClient from 'cozy-client'
import { fireEvent, render, wait } from '@testing-library/react'
import AppLike from 'test/AppLike'
import Error from './Error'

describe('Error Page', () => {
  const setup = () => {
    const client = new CozyClient({})
    client.query = jest.fn()
    client.queryAll = jest.fn()
    const root = render(
      <AppLike client={client}>
        <Error emptyIcon={{}} />
      </AppLike>
    )

    return root
  }

  it('should render the error page', async () => {
    const root = setup()

    await wait(() => {
      expect(root.getByText('We failed to display your bank data')).toBeTruthy()
      expect(
        root.getByText(
          'You can try again by reloading the page. If the problem persists consult our FAQ.'
        )
      ).toBeTruthy()
      expect(root.getByText('Reload page')).toBeTruthy()
      expect(root.getByText('Consult our FAQ')).toBeTruthy()
    })
  })

  it('should reload the page', async () => {
    const root = setup()
    Object.defineProperty(window, 'location', {
      value: { reload: jest.fn() }
    })
    await wait(async () => {
      const reloadBtn = root.getByText('Reload page')
      await fireEvent.click(reloadBtn)
      expect(window.location.reload).toHaveBeenCalledTimes(1)
      expect(window.location.reload).toHaveBeenCalledWith(true)
    })
  })

  it('should open consult faq page', async () => {
    const root = setup()
    await wait(() => {
      const consultBtn = root.getByTestId('consult-button')
      expect(consultBtn.href).toBe('https://cozy.io/en/support/')
      expect(consultBtn.target).toBe('_blank')
    })
  })
})
