import { render, fireEvent } from '@testing-library/react'
import { createMockClient } from 'cozy-client/dist/mock'
import React from 'react'
import AppLike from 'test/AppLike'
import CategoryAlertSettingsPane from './CategoryAlertSettingsPane'
import { SETTINGS_DOCTYPE } from 'doctypes'
import { act } from 'react-dom/test-utils'

describe('category alert settings pane', () => {
  const setup = ({ categoryBudgetAlerts }) => {
    const client = createMockClient({
      queries: {
        settings: {
          doctype: SETTINGS_DOCTYPE,
          lastUpdate: new Date(),
          data: [
            {
              _id: 'c0ffeedeadbeef',
              categoryBudgetAlerts
            }
          ]
        }
      }
    })
    const root = render(
      <AppLike client={client}>
        <CategoryAlertSettingsPane />
      </AppLike>
    )
    return { client, root }
  }

  it('should create an alert', async () => {
    const { root, client } = setup({
      categoryBudgetAlerts: [{ id: 0, categoryId: '400600', maxThreshold: 100 }]
    })
    const { getByText, getByRole, queryByRole } = root

    client.save = jest.fn()
    getByText('Monthly budget of')
    getByText('100€')
    getByText('Others : Health')
    getByText('for all accounts')

    expect(queryByRole('dialog')).toBeFalsy()

    fireEvent.click(getByText('Create alert'))

    const dialog = getByRole('dialog')
    expect(dialog).toBeTruthy()

    fireEvent.click(getByText('Supermarket'))
    fireEvent.click(getByText('Education, training'))
    await fireEvent.click(getByText('Tuition'))

    const input = root.getByDisplayValue('100')
    fireEvent.change(input, { target: { value: 200 } })

    const btns = root.getAllByText('Create alert')
    await act(async () => await fireEvent.click(btns[1]))

    expect(getByText('200€'))
    expect(getByText('Tuition'))
  })

  it('should update an alert', async () => {
    const { root, client } = setup({
      categoryBudgetAlerts: [{ id: 0, categoryId: '400600', maxThreshold: 120 }]
    })
    const { getByText } = root
    client.save = jest.fn()

    const card = getByText('Monthly budget of')
    getByText('120€')
    getByText('Others : Health')
    getByText('for all accounts')

    await fireEvent.click(card)
    fireEvent.click(root.getAllByText('Others : Health')[1])
    fireEvent.click(getByText('Health'))
    fireEvent.click(getByText('Health insurance'))

    const input = root.getByDisplayValue('120')
    await fireEvent.change(input, { target: { value: 250 } })
    await act(async () => {
      await fireEvent.click(getByText('Update alert'))
    })
    expect(root.queryByText('120€')).toBeFalsy()
    expect(root.getByText('250€'))
    expect(root.getByText('Health insurance'))
  })
})
