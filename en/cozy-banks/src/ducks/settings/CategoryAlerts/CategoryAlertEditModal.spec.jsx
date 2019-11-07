import { mount } from 'enzyme'
import React from 'react'
import { CozyProvider } from 'cozy-client'
import CategoryAlertEditModal from './CategoryAlertEditModal'
import AccountIcon from 'components/AccountIcon'
import fixtures from 'test/fixtures/unit-tests.json'
import { TestI18n } from 'test/AppLike'
import getClient from 'selectors/getClient'
import { createClientWithData } from 'test/client'
import Row from 'components/Row'
import Input from 'cozy-ui/transpiled/react/Input'
import { ACCOUNT_DOCTYPE } from 'doctypes'

jest.mock('selectors/getClient', () => jest.fn())
jest.mock('components/AccountIcon', () => () => null)

describe('category alert edition modal', () => {
  let client
  beforeEach(() => {
    client = createClientWithData({
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
      balanceThresholdMin: 200,
      categoryId: '400110'
    }
    const root = mount(
      <CozyProvider client={client}>
        <TestI18n>
          <CategoryAlertEditModal initialAlert={alert} />
        </TestI18n>
      </CozyProvider>
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
    expect(root.find(Row).map(n => n.text())).toEqual([
      'PEE Isabelle',
      'Supermarket'
    ])
    expect(root.find(Input).prop('defaultValue')).toBe(200)
  })
})
