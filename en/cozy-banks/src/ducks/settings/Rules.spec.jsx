import { mount } from 'enzyme'
import React from 'react'
import CategoryAlertCard from 'ducks/settings/CategoryAlerts/CategoryAlertCard'
import CategoryAlertEditModal from 'ducks/settings/CategoryAlerts/CategoryAlertEditModal'

import { makeNewAlert } from 'ducks/budgetAlerts'
import Rules, { AddRuleButton } from 'ducks/settings/Rules'
import AppLike from 'test/AppLike'
import { act } from 'react-dom/test-utils'

describe('Rules', () => {
  const setup = ({ initialRules }) => {
    const root = mount(
      <AppLike>
        <Rules
          rules={initialRules}
          onUpdate={() => {}}
          onError={() => {}}
          addButtonLabelKey="Settings.rules.create"
          makeNewItem={makeNewAlert}
          ItemEditionModal={CategoryAlertEditModal}
        >
          {(alert, i, createOrUpdateAlert, removeAlert) => (
            <div key={i}>
              <CategoryAlertCard
                updateAlert={createOrUpdateAlert}
                removeAlert={removeAlert}
                alert={alert}
              />
            </div>
          )}
        </Rules>
      </AppLike>
    )
    return { root }
  }

  it('should be possible to create a rule', () => {
    const { root } = setup({ initialRules: [] })
    act(() => {
      root.find(AddRuleButton).props().onClick()
    })
    root.update()
    const modal = root.find(CategoryAlertEditModal)
    expect(modal.props().initialDoc).toEqual({
      accountOrGroup: null,
      categoryId: '400110',
      maxThreshold: 100
    })
  })
})
