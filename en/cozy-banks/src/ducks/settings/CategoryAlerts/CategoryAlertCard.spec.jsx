import { mount } from 'enzyme'
import React from 'react'
import { createMockClient } from 'cozy-client'
import AppLike from 'test/AppLike'
import CategoryAlertCard from './CategoryAlertCard'
import getClient from 'selectors/getClient'
import { GROUP_DOCTYPE } from 'doctypes'

jest.mock('selectors/getClient', () => jest.fn())

describe('category alert card', () => {
  it('should correctly render with group', () => {
    const alert = {
      categoryId: '400610',
      maxThreshold: 100,
      accountOrGroup: {
        _type: GROUP_DOCTYPE,
        _id: 'group1337'
      }
    }
    const client = createMockClient({
      queries: {
        groups: {
          doctype: GROUP_DOCTYPE,
          data: [
            { _id: 'group1337', _type: GROUP_DOCTYPE, label: 'My Accounts' }
          ]
        }
      }
    })

    getClient.mockReturnValue(client)
    const root = mount(
      <AppLike client={client} store={client.store}>
        <CategoryAlertCard
          alert={alert}
          updateAlert={jest.fn()}
          removeAlert={jest.fn()}
        />
      </AppLike>
    )
    expect(root.text()).toBe(
      'Monthly budget of 100€in Health expensesfor group My Accounts'
    )
  })
})
