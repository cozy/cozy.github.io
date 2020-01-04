/* global mount */

import React from 'react'
import data from 'test/fixtures/unit-tests.json'
import GroupPanel, {
  DumbGroupPanel,
  getGroupPanelSummaryClasses
} from './GroupPanel'
import CozyClient from 'cozy-client'
import mapValues from 'lodash/mapValues'
import fromPairs from 'lodash/fromPairs'
import { schema } from 'doctypes'
import AppLike from 'test/AppLike'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import { createClientWithData } from 'test/client'
import { TRANSACTION_DOCTYPE, SETTINGS_DOCTYPE } from 'doctypes'
import getClient from 'selectors/getClient'
import MockDate from 'mockdate'

jest.mock('components/AccountIcon', () => () => null)
jest.mock('selectors/getClient')

const addType = data => {
  return mapValues(data, (docs, doctype) => {
    return docs.map(doc => ({ ...doc, _type: doctype }))
  })
}

const rawGroup = data['io.cozy.bank.groups'][0]
let client, group

beforeAll(() => {
  client = new CozyClient({
    schema
  })
  getClient.mockReturnValue(client)
  client.setData(addType(data))
  group = client.hydrateDocument(
    client.getDocumentFromState('io.cozy.bank.groups', rawGroup._id)
  )
})

describe('GroupPanel', () => {
  let root, onChange, switches

  const fakeRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    setRouteLeaveHook: jest.fn(),
    isActive: jest.fn()
  }

  const Wrapper = ({ expanded }) => (
    <AppLike client={client}>
      <GroupPanel
        expanded={expanded}
        checked={true}
        group={group}
        warningLimit={400}
        switches={switches}
        onSwitchChange={() => {}}
        onChange={onChange}
        router={fakeRouter}
      />
    </AppLike>
  )

  beforeEach(() => {
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
    root = mount(<Wrapper expanded={false} />)
  })

  it('should optimistically update', () => {
    const gp = root.find(DumbGroupPanel).instance()
    const ev = {}
    expect(root.find(ExpansionPanel).props().expanded).toBe(false)
    gp.handlePanelChange(ev, true)
    expect(gp.state.optimisticExpanded).toBe(true)
    expect(onChange).toHaveBeenCalledWith(group._id, ev, true)
    root.update()
    expect(root.find(ExpansionPanel).props().expanded).toBe(true)
  })

  it('should prioritize optimizeExpanded', () => {
    const gp = root.find(DumbGroupPanel).instance()
    const ev = {}

    // sanity check
    expect(root.find(ExpansionPanel).props().expanded).toBe(false)

    gp.handlePanelChange(ev, true)
    expect(gp.state.optimisticExpanded).toBe(true)
    expect(onChange).toHaveBeenCalledWith(group._id, ev, true)
    root.update()
    expect(root.find(ExpansionPanel).props().expanded).toBe(true)

    // The request failed but we still want the panel to be toggled
    // We ignore the fact that the request failed as UI coherency
    // is more important for the user
    root.setProps({ expanded: false })
    root.update()
    expect(root.find(ExpansionPanel).props().expanded).toBe(true)
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
    getClient.mockReturnValue(client)
  })

  const setup = ({
    lateHealthReimbursementNotificationSetting,
    transactions
  }) => {
    const client = createClientWithData({
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
                lateHealthReimbursement: lateHealthReimbursementNotificationSetting
              }
            }
          ]
        }
      }
    })
    const state = client.store.getState()
    return { state }
  }

  const healthExpense = {
    manualCategoryId: '400610',
    amount: -10,
    _id: 'transaction-1234',
    date: '2019-10-19T00:00'
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
      content: 'GroupPanelSummary--lateHealthReimbursements'
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
