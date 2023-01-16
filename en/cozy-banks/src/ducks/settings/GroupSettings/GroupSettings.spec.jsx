import React from 'react'
import { useNavigate } from 'react-router-dom'
import { render, fireEvent, act } from '@testing-library/react'
import omit from 'lodash/omit'
import cloneDeep from 'lodash/cloneDeep'

import { createMockClient } from 'cozy-client/dist/mock'

import { schema, GROUP_DOCTYPE } from 'doctypes'
import AppLike from 'test/AppLike'
import fixtures from 'test/fixtures'
import GroupSettings from './GroupSettings'
import AccountsList from './AccountsList'

const fixtureGroup = fixtures[GROUP_DOCTYPE][0]

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}))

jest.mock('components/BackButton', () => () => null)

const createClient = () => {
  const client = new createMockClient({
    queries: {},
    clientOptions: {
      schema
    }
  })
  client.save = jest.fn().mockResolvedValue({ data: { id: '1234' } })
  return client
}

const setup = ({ group, client: clientOption }) => {
  const navigate = jest.fn()
  useNavigate.mockReturnValue(navigate)
  const client = clientOption || createClient()
  const account = fixtures['io.cozy.bank.accounts'][0]

  const root = render(
    <AppLike client={client} initialEntries={['/settings/groups/1234']}>
      <GroupSettings
        account={account}
        group={group}
        client={client}
        breakpoints={{ isMobile: false }}
      />
    </AppLike>
  )
  return { navigate, client, root }
}

describe('GroupSettings', () => {
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
    const group = omit(fixtures[GROUP_DOCTYPE][0], ['_id', 'id'])
    const { navigate, client, root } = setup({ group })
    await rename(root, 'Renamed group')
    expect(client.save).toHaveBeenCalledWith({
      accounts: ['compteisa1', 'comptelou1', 'comptecla1', 'comptegene1'],
      label: 'Renamed group'
    })
    expect(navigate).toHaveBeenCalledWith('/settings/groups/1234')
  })

  it('should rename autogroup', async () => {
    const group = {
      ...fixtures[GROUP_DOCTYPE][0],
      accountType: 'Checkings'
    }
    const { navigate, client, root } = setup({ group })
    await rename(root, 'Renamed group')
    expect(client.save).toHaveBeenCalledWith({
      _id: 'familleelargie',
      accountType: null,
      accounts: ['compteisa1', 'comptelou1', 'comptecla1', 'comptegene1'],
      id: 'familleelargie',
      label: 'Renamed group'
    })
    expect(navigate).not.toHaveBeenCalled()
  })

  const setupAccountList = ({ accounts, group, client }) => {
    const root = render(
      <AppLike client={client}>
        <AccountsList accounts={accounts} group={group} />
      </AppLike>
    )

    return { root, client }
  }

  it('should be possible to toggle an account from a group', async () => {
    const rawGroup = {
      _type: GROUP_DOCTYPE,
      ...cloneDeep(fixtureGroup)
    }
    const client = createClient()
    client.save = jest.fn()
    const group = client.hydrateDocument(rawGroup)
    const account = fixtures['io.cozy.bank.accounts'][0]
    const { root } = setupAccountList({
      client,
      accounts: [account],
      group
    })

    const sw = root.getByRole('checkbox')
    expect(sw.checked).toBe(false)
    expect(group.accounts.data.length).toBe(4)

    await act(async () => {
      fireEvent.click(sw, { target: { value: false } })
    })

    const sw2 = root.getByRole('checkbox')
    expect(group.accounts.data.length).toBe(5)
    expect(sw2.checked).toBe(true)
  })

  it('should be possible to toggle an account from a group (save fails)', async () => {
    jest.spyOn(console, 'warn').mockImplementation()
    const rawGroup = {
      _type: GROUP_DOCTYPE,
      ...cloneDeep(fixtureGroup)
    }
    const client = createClient()
    client.save = jest.fn().mockRejectedValue('Error')

    const group = client.hydrateDocument(rawGroup)
    const account = fixtures['io.cozy.bank.accounts'][0]
    const { root } = setupAccountList({
      client,
      accounts: [account],
      group
    })

    const sw = root.getByRole('checkbox')
    expect(sw.checked).toBe(false)

    await act(async () => {
      fireEvent.click(sw, { target: { value: false } })
    })
    expect(client.save).toHaveBeenCalled()

    const sw2 = root.getByRole('checkbox')
    expect(sw2.checked).toBe(false)
  })

  it('should show other groups of an account', () => {
    const client = createMockClient({
      queries: {
        groups: {
          lastUpdate: new Date(),
          doctype: GROUP_DOCTYPE,
          data: fixtures[GROUP_DOCTYPE]
        }
      },
      clientOptions: {
        schema
      }
    })
    const rawGroup = {
      _type: GROUP_DOCTYPE,
      ...cloneDeep(fixtureGroup)
    }
    const group = client.hydrateDocument(rawGroup)

    const account = fixtures['io.cozy.bank.accounts'].find(
      x => x._id == 'compteisa1'
    )

    const { root } = setupAccountList({
      client,
      accounts: [account],
      group
    })

    // Check that the "groups" column contains Isabelle
    // It does not contain "Famille élargie" since we are "viewing"
    // this group
    expect(root.getByText('Isabelle')).toBeTruthy()
  })
})
