import React from 'react'
import {
  DumbGroupSettings as GroupSettings,
  AccountLine
} from './GroupSettings'
import Toggle from 'cozy-ui/transpiled/react/Toggle'
import { mount } from 'enzyme'
import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures'
import { keyBy, omit } from 'lodash'

jest.mock('components/BackButton', () => () => null)

describe('GroupSettings', () => {
  const setup = ({ group }) => {
    const account = fixtures['io.cozy.bank.accounts'][0]
    const router = {
      push: jest.fn()
    }
    const client = {
      save: jest.fn().mockResolvedValue({ data: { id: '1234' } })
    }
    const root = mount(
      <AppLike>
        <GroupSettings
          account={account}
          group={group}
          router={router}
          client={client}
          breakpoints={{ isMobile: false }}
          t={x => x}
        />
      </AppLike>
    )
    const instance = root.find(GroupSettings).instance()
    return { router, client, root, instance }
  }

  it('should rename new group', async () => {
    const group = omit(fixtures['io.cozy.bank.groups'][0], ['_id', 'id'])
    const { router, client, instance } = setup({ group })
    await instance.rename('Renamed group')
    expect(client.save).toHaveBeenCalledWith({
      accounts: ['compteisa1', 'comptelou1', 'comptecla1', 'comptegene1'],
      label: 'Renamed group'
    })
    expect(router.push).toHaveBeenCalledWith('/settings/groups/1234')
  })

  it('should rename autogroup', async () => {
    const group = {
      ...fixtures['io.cozy.bank.groups'][0],
      accountType: 'checkings'
    }
    const { router, client, instance } = setup({ group })
    await instance.rename('Renamed group')
    expect(client.save).toHaveBeenCalledWith({
      _id: 'familleelargie',
      accountType: null,
      accounts: ['compteisa1', 'comptelou1', 'comptecla1', 'comptegene1'],
      id: 'familleelargie',
      label: 'Renamed group'
    })
    expect(router.push).not.toHaveBeenCalled()
  })

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

    const toggles = root.find(Toggle)
    toggles.at(0).simulate('click')

    expect(existsById).toHaveBeenCalledWith(account._id)
  })
})
