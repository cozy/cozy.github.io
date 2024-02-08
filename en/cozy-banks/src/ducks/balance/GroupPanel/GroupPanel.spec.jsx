import React from 'react'
import fixtures from 'test/fixtures/unit-tests.json'
import mapValues from 'lodash/mapValues'
import fromPairs from 'lodash/fromPairs'
import { render, fireEvent } from '@testing-library/react'

import { createMockClient } from 'cozy-client/dist/mock'
import {
  schema,
  GROUP_DOCTYPE,
  ACCOUNT_DOCTYPE,
  TRANSACTION_DOCTYPE,
  SETTINGS_DOCTYPE
} from 'doctypes'

import AppLike from 'test/AppLike'
import getClient from 'selectors/getClient'
import MockDate from 'mockdate'

import { GroupPanel } from './GroupPanel'
import { getGroupPanelSummaryClasses } from './helpers'

jest.mock('components/AccountIcon', () => () => null)
jest.mock('selectors/getClient')

const addType = data => {
  return mapValues(data, (docs, doctype) => {
    return docs.map(doc => ({ ...doc, _type: doctype }))
  })
}

const rawGroup = fixtures['io.cozy.bank.groups'][0]

describe('GroupPanel', () => {
  let root, onChange, switches

  const setup = ({ group: rawGroup, initialExpanded = false }) => {
    const client = createMockClient({
      clientOptions: {
        schema
      },
      queries: {
        groups: {
          doctype: GROUP_DOCTYPE,
          data: [rawGroup]
        },
        accounts: {
          doctype: ACCOUNT_DOCTYPE,
          data: fixtures['io.cozy.bank.accounts']
        }
      }
    })
    const data = {}
    getClient.mockReturnValue(client)
    client.setData(addType(data))
    const group = client.hydrateDocument(
      client.getDocumentFromState('io.cozy.bank.groups', rawGroup._id)
    )
    const Wrapper = ({ expanded }) => (
      <AppLike client={client}>
        <GroupPanel
          expanded={expanded}
          checked={true}
          group={group}
          switches={switches}
          onSwitchChange={() => {}}
          onChange={onChange}
        />
      </AppLike>
    )

    switches = fromPairs(
      rawGroup.accounts.map(accId => [
        accId,
        {
          checked: true,
          disabled: false
        }
      ])
    )
    onChange = jest.fn()
    root = render(<Wrapper expanded={initialExpanded} />)

    return { root, client }
  }

  it('should optimistically update', () => {
    const { root } = setup({ group: rawGroup })
    const expandButton = root.getAllByRole('button')[0]
    expect(expandButton.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(expandButton)

    const buttons = root.queryAllByRole('button')
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
  })

  it('should show a removal button when there are no accounts in the group', async () => {
    const groupWithoutAccounts = { ...rawGroup, accounts: [] }
    const { root, client } = setup({
      group: groupWithoutAccounts,
      initialExpanded: true
    })
    client.destroy = jest.fn()

    const removeButton = root.getByText('remove')
    await fireEvent.click(removeButton)
    expect(client.destroy).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: groupWithoutAccounts._id
      })
    )
  })
})

describe('Reimbursement virtual group styling', () => {
  // We need a different date for each test otherwise selectors are not
  // recomputed since queryCreateSelector bases its memoization on
  // the lastUpdate of the query
  const mockedDate = +new Date('2020-01-31T00:00')
  let i = 0
  beforeEach(() => {
    MockDate.set(mockedDate + i++)
  })

  const setup = ({
    lateHealthReimbursementNotificationSetting,
    transactions
  }) => {
    const client = createMockClient({
      queries: {
        transactions: {
          doctype: TRANSACTION_DOCTYPE,
          data: transactions
        },
        settings: {
          doctype: SETTINGS_DOCTYPE,
          data: [
            {
              _id: 'settings-1234',
              notifications: {
                lateHealthReimbursement:
                  lateHealthReimbursementNotificationSetting
              }
            }
          ]
        }
      }
    })
    getClient.mockReturnValue(client)
    const state = client.store.getState()
    return { state }
  }

  const healthExpense = {
    account: 'comptegene1',
    manualCategoryId: '400610',
    amount: -10,
    _id: 'transaction-1234',
    date: '2019-10-19T00:00',
    label: 'A health expense'
  }

  const virtualReimbursementGroup = {
    virtual: true,
    _id: 'Reimbursements'
  }

  const lateHealthReimbursementNotificationSetting = {
    enabled: true,
    value: 30
  }

  it('should have specific style if late reimbursements are present and setting is enabled', () => {
    const { state } = setup({
      transactions: [healthExpense],
      lateHealthReimbursementNotificationSetting
    })
    expect(
      getGroupPanelSummaryClasses(virtualReimbursementGroup, state)
    ).toEqual({
      root: 'GroupPanelSummary--lateHealthReimbursements'
    })
  })

  it('should not have specific style if no late reimbursements are present', () => {
    const healthCredit = { ...healthExpense, amount: 10 }
    const { state } = setup({
      transactions: [healthCredit],
      lateHealthReimbursementNotificationSetting
    })
    expect(
      getGroupPanelSummaryClasses(virtualReimbursementGroup, state)
    ).toBeFalsy()
  })

  it('should not have specific style if setting not enabled', () => {
    const { state } = setup({
      transactions: [healthExpense],
      lateHealthReimbursementNotificationSetting: {
        ...lateHealthReimbursementNotificationSetting,
        enabled: false
      }
    })
    expect(
      getGroupPanelSummaryClasses(virtualReimbursementGroup, state)
    ).toBeFalsy()
  })

  it('should not have specific style if not virtual reimbursement group', () => {
    const { state } = setup({
      transactions: [healthExpense],
      lateHealthReimbursementNotificationSetting
    })
    const normalGroup = {
      _id: 'deadbeef',
      accounts: []
    }
    expect(getGroupPanelSummaryClasses(normalGroup, state)).toBeFalsy()
  })

  it('should not have specific style if not virtual reimbursement group', () => {
    const { state } = setup({
      transactions: [healthExpense],
      lateHealthReimbursementNotificationSetting
    })
    const normalGroup = {
      _id: 'deadbeef',
      accounts: []
    }
    expect(getGroupPanelSummaryClasses(normalGroup, state)).toBeFalsy()
  })
})
