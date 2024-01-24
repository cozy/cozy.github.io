import { mount } from 'enzyme'
import React from 'react'
import { createMockClient } from 'cozy-client'
import CategoryAlertEditModal from './CategoryAlertEditModal'
import AccountIcon from 'components/AccountIcon'
import fixtures from 'test/fixtures/unit-tests.json'
import getClient from 'selectors/getClient'
import Input from 'cozy-ui/transpiled/react/Input'
import { ACCOUNT_DOCTYPE } from 'doctypes'
import AppLike from 'test/AppLike'
import ListItem from 'cozy-ui/transpiled/react/ListItem'

jest.mock('selectors/getClient', () => jest.fn())
jest.mock('components/AccountIcon', () => () => null)

describe('category alert edition modal', () => {
  let client
  beforeEach(() => {
    client = createMockClient({
      queries: {
        accounts: {
          data: fixtures[ACCOUNT_DOCTYPE],
          doctype: ACCOUNT_DOCTYPE
        }
      }
    })
    getClient.mockReturnValue(client)
  })

  it('should display the account label & icon, thresold value and category name', () => {
    const alert = {
      accountOrGroup: {
        _id: 'compteisa4',
        _type: 'io.cozy.bank.accounts'
      },
      maxThreshold: 200,
      categoryId: '400110'
    }
    const root = mount(
      <AppLike client={client}>
        <CategoryAlertEditModal
          onEdit={() => {}}
          onDismiss={() => {}}
          initialDoc={alert}
        />
      </AppLike>
    )
    const accountIcon = root.find(AccountIcon)
    expect(accountIcon.length).toBe(1)
    expect(accountIcon.props().account).toMatchObject(
      expect.objectContaining({
        cozyMetadata: {
          createdByApp: 'caissedepargne1'
        }
      })
    )
    expect(root.find(ListItem).map(n => n.text())).toEqual([
      'PEE Isabelle',
      'Supermarket'
    ])
    expect(root.find(Input).prop('defaultValue')).toBe(200)
  })
})
