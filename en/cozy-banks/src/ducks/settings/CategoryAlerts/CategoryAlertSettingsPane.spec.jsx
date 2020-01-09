import { mount } from 'enzyme'
import { createClientWithData } from 'test/client'
import React from 'react'
import AppLike from 'test/AppLike'
import { Button } from 'cozy-ui/transpiled/react'
import CategoryAlertSettingsPane from './CategoryAlertSettingsPane'
import CategoryAlertCard from './CategoryAlertCard'
import { SETTINGS_DOCTYPE } from 'doctypes'
import { act } from 'react-dom/test-utils'
import EditionModal from 'components/EditionModal'

describe('category alert settings pane', () => {
  const setup = ({ categoryBudgetAlerts }) => {
    const client = createClientWithData({
      queries: {
        settings: {
          doctype: SETTINGS_DOCTYPE,
          data: [
            {
              _id: 'c0ffeedeadbeef',
              categoryBudgetAlerts
            }
          ]
        }
      }
    })

    const root = mount(
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
    client.save = jest.fn()
    expect(root.find(CategoryAlertCard).length).toBe(1)
    const btn = root.find(Button)
    act(() => {
      btn.props().onClick()
    })
    root.update()
    const editionModal = root.find(EditionModal)
    const { onEdit } = editionModal.props()
    await act(async () => {
      await onEdit({
        categoryId: '400610',
        maxThreshold: 200
      })
    })
    root.update()
    expect(root.find(CategoryAlertCard).length).toBe(2)
    expect(root.text()).toContain('200€')
    expect(root.text()).toContain('Health expenses')
  })

  it('should update an alert', () => {
    const { root, client } = setup({
      categoryBudgetAlerts: [{ id: 0, categoryId: '400600', maxThreshold: 100 }]
    })
    client.save = jest.fn()
    expect(root.find(CategoryAlertCard).length).toBe(1)
    const card = root.find(CategoryAlertCard)
    const { updateAlert } = card.props()
    act(() => {
      updateAlert({
        id: 0,
        categoryId: '400610',
        maxThreshold: 200
      })
    })
    expect(root.find(CategoryAlertCard).length).toBe(1)
    expect(root.text()).toContain('200€')
    expect(root.text()).toContain('Health expenses')
  })
})
