/* global mount */

import React from 'react'
import { GroupSettings, AccountLine } from './GroupSettings'
import Switch from 'cozy-ui/transpiled/react/MuiCozyTheme/Switch'
import { render, fireEvent, act } from '@testing-library/react'
import { createMockClient } from 'cozy-client/dist/mock'
import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures'
import omit from 'lodash/omit'
import keyBy from 'lodash/keyBy'

jest.mock('components/BackButton', () => () => null)

describe('GroupSettings', () => {
  const setup = ({ group }) => {
    const account = fixtures['io.cozy.bank.accounts'][0]
    const router = {
      push: jest.fn(),
      replace: jest.fn(),
      go: jest.fn(),
      goBack: jest.fn(),
      goForward: jest.fn(),
      setRouteLeaveHook: jest.fn(),
      isActive: jest.fn(),
      params: {
        groupId: '1234'
      }
    }
    const client = new createMockClient({
      queries: {}
    })
    client.save = jest.fn().mockResolvedValue({ data: { id: '1234' } })

    const root = render(
      <AppLike router={router} client={client}>
        <GroupSettings
          account={account}
          group={group}
          router={router}
          client={client}
          breakpoints={{ isMobile: false }}
        />
      </AppLike>
    )
    return { router, client, root }
  }

  const rename = async (root, newName) => {
    const modifyBtn = root.getByText('Rename')
    await fireEvent.click(modifyBtn)
    const input = root.getByPlaceholderText('My group')
    await fireEvent.change(input, { target: { value: newName } })
    const saveBtn = root.getByText('Save')
    await act(async () => {
      fireEvent.click(saveBtn)
    })
  }

  it('should rename new group', async () => {
    const group = omit(fixtures['io.cozy.bank.groups'][0], ['_id', 'id'])
    const { router, client, root } = setup({ group })
    await rename(root, 'Renamed group')
    expect(client.save).toHaveBeenCalledWith({
      accounts: ['compteisa1', 'comptelou1', 'comptecla1', 'comptegene1'],
      label: 'Renamed group'
    })
    expect(router.push).toHaveBeenCalledWith('/settings/groups/1234')
  })

  it('should rename autogroup', async () => {
    const group = {
      ...fixtures['io.cozy.bank.groups'][0],
      accountType: 'Checkings'
    }
    const { router, client, root } = setup({ group })
    await rename(root, 'Renamed group')
    expect(client.save).toHaveBeenCalledWith({
      _id: 'familleelargie',
      accountType: null,
      accounts: ['compteisa1', 'comptelou1', 'comptecla1', 'comptegene1'],
      id: 'familleelargie',
      label: 'Renamed group'
    })
    expect(router.push).not.toHaveBeenCalled()
  })

  const setupAccountLine = ({ account, group, toggleAccount }) => {
    const root = mount(
      <AppLike>
        <table>
          <tbody>
            <AccountLine
              account={account}
              group={group}
              toggleAccount={toggleAccount}
            />
          </tbody>
        </table>
      </AppLike>
    )

    return { root }
  }

  it('Should call existsById with an id when rendering an account line', () => {
    const group = fixtures['io.cozy.bank.groups'][0]
    const accountsById = keyBy(fixtures['io.cozy.bank.accounts'], '_id')
    const existsById = jest.fn()
    group.accounts = {
      data: group.accounts.map(accountId => accountsById[accountId]),
      existsById
    }
    const account = fixtures['io.cozy.bank.accounts'][0]
    const toggleAccount = jest.fn()
    const { root } = setupAccountLine({
      account,
      group,
      toggleAccount
    })

    const switches = root.find(Switch)
    switches.props().onClick({
      target: {
        checked: true
      }
    })

    expect(existsById).toHaveBeenCalledWith(account._id)
    expect(toggleAccount).toHaveBeenCalledWith(
      'compteisa4',
      expect.objectContaining({ _id: 'familleelargie' }),
      true
    )
  })
})
