import React from 'react'
import { mount } from 'enzyme'
import fixtures from 'test/fixtures/unit-tests.json'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE, SETTINGS_DOCTYPE } from 'doctypes'
import AppLike from 'test/AppLike'
import CozyClient, { createMockClient } from 'cozy-client'

import {
  fetchSettings,
  withAccountOrGroupLabeller,
  getWarningLimitsPerAccount,
  reverseIndex,
  disableOutdatedNotifications,
  downloadFile
} from './helpers'

describe('defaulted settings', () => {
  it('should return defaulted settings', async () => {
    const fakeClient = {
      find: () => {},
      query: () => {
        return Promise.resolve({
          data: [
            {
              pin: '1234'
            },
            {
              notifications: {
                balanceLower: {
                  value: 600,
                  enabled: false
                }
              }
            }
          ]
        })
      }
    }
    const settings = await fetchSettings(fakeClient)
    expect(settings).toMatchSnapshot()
  })
})

describe('withAccountOrGroupLabeller', () => {
  const setup = ({ accountOrGroup }) => {
    const client = createMockClient({
      queries: {
        groups: {
          doctype: GROUP_DOCTYPE,
          data: fixtures[GROUP_DOCTYPE]
        },
        accounts: {
          doctype: ACCOUNT_DOCTYPE,
          data: fixtures[ACCOUNT_DOCTYPE]
        }
      }
    })

    const DumbComponent = ({ accountOrGroup, getAccountOrGroupLabel }) => {
      return <div>{getAccountOrGroupLabel(accountOrGroup)}</div>
    }

    const Component = withAccountOrGroupLabeller('getAccountOrGroupLabel')(
      DumbComponent
    )

    const root = mount(
      <AppLike client={client} store={client.store}>
        <Component accountOrGroup={accountOrGroup} />
      </AppLike>
    )
    return { root }
  }

  it('should correctly name an account', () => {
    const { root } = setup({
      accountOrGroup: {
        _id: 'compteisa1',
        _type: ACCOUNT_DOCTYPE
      }
    })
    expect(root.text()).toBe('Compte courant Isabelle')
  })

  it('should correctly name a group', () => {
    const ENLARGED_FAMILY_GROUP_ID = 'familleelargie'
    const { root } = setup({
      accountOrGroup: {
        _id: ENLARGED_FAMILY_GROUP_ID,
        _type: GROUP_DOCTYPE
      }
    })
    expect(root.text()).toBe('Famille élargie')
  })

  it('should correctly name an autogroup', () => {
    const { root } = setup({
      accountOrGroup: {
        _id: 'autogroup1',
        _type: GROUP_DOCTYPE
      }
    })
    expect(root.text()).toBe('Checking accounts')
  })
})

describe('reverseIndex', () => {
  it('should work', () => {
    const homer = { keys: [1, 2, 3], name: 'homer' }
    const marge = { keys: [4, 2, 6], name: 'marge' }
    expect(reverseIndex([homer, marge], x => x.keys)).toEqual({
      1: [homer],
      2: [homer, marge],
      3: [homer],
      4: [marge],
      6: [marge]
    })
  })
})

describe('getWarningLimitsPerAccount', () => {
  it('should return warningLimitsPerAccount from rules, groups and accounts', () => {
    const groups = fixtures[GROUP_DOCTYPE]
    const accounts = fixtures[ACCOUNT_DOCTYPE]
    const rules = [
      {
        value: 75,
        accountOrGroup: {
          _type: GROUP_DOCTYPE,
          _id: 'familleelargie'
        },
        enabled: true
      },
      {
        value: 50,
        accountOrGroup: {
          _type: GROUP_DOCTYPE,
          _id: 'isabelle'
        },
        enabled: true
      },
      {
        value: 100,
        accountOrGroup: {
          _type: ACCOUNT_DOCTYPE,
          _id: 'comptelou1'
        },
        enabled: true
      },
      {
        value: 10,
        enabled: true
      },
      {
        value: 15
      }
    ]
    const warningLimits = getWarningLimitsPerAccount(rules, accounts, groups)
    expect(warningLimits['comptelou1']).toBe(100)
    expect(warningLimits['compteisa3']).toBe(50)
    expect(warningLimits['compteisa1']).toBe(75)
    expect(warningLimits['comptegene1']).toBe(75)
    // isa4 is not in the isabelle group
    expect(warningLimits['compteisa4']).toBe(10)
  })
})

describe('remove account from notifications', () => {
  it('should remove account from notifications when an account is deleted', async () => {
    jest.spyOn(console, 'info').mockImplementation(() => {})
    const client = new CozyClient()
    const oldSettings = {
      _rev: 'rev-1',
      ...fixtures[SETTINGS_DOCTYPE][0]
    }
    client.queryAll = jest
      .fn()
      .mockResolvedValueOnce({
        data: [{ _id: 'compteisa1', _type: ACCOUNT_DOCTYPE, _deleted: true }]
      })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: [oldSettings] })

    client.save = jest.fn()
    const disabledNotifs = await disableOutdatedNotifications(client)

    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: expect.objectContaining({
          balanceLower: [
            expect.objectContaining({
              id: 0,
              enabled: false,
              accountOrGroup: null,
              value: 100
            })
          ]
        })
      })
    )

    expect(disabledNotifs).toEqual([
      {
        accountOrGroup: {
          _id: 'compteisa1',
          _type: 'io.cozy.bank.accounts'
        },
        enabled: true,
        id: 0,
        value: 100
      },
      {
        accountOrGroup: {
          _id: 'compteisa1',
          _type: 'io.cozy.bank.accounts'
        },
        enabled: true,
        id: 0,
        value: 1000
      }
    ])
  })
})

describe('downloadFile', () => {
  const setup = ({
    mockQueued = jest.fn(),
    mockCreate = jest.fn(),
    mockDownload = jest.fn()
  } = {}) => {
    const client = {
      collection: jest.fn(() => ({
        queued: mockQueued,
        create: mockCreate,
        download: mockDownload
      }))
    }
    return client
  }
  it('should early return if file is falsy', async () => {
    const mockDownload = jest.fn(() => 'download_link')
    setup({ mockDownload })

    await downloadFile(undefined)

    expect(mockDownload).toBeCalledTimes(0)
  })

  it('should call "download" with correct arguments ', async () => {
    const mockFile = { id: '00', name: 'mockFileName' }
    const mockDownload = jest.fn(() => 'download_link')
    const client = setup({ mockDownload })

    await downloadFile(client, mockFile)

    expect(mockDownload).toBeCalledTimes(1)
    expect(mockDownload).toBeCalledWith(mockFile)
  })
})
