const { omit } = require('lodash')
const { fixAccount } = require('./fixAccounts')

describe('fixAccount', async () => {
  let client

  const mockedFolder = {
    attributes: {
      path: '/Administrative/Test/claude_cozycloud_cc'
    }
  }

  const mockedTrigger = {
    message: {
      folder_to_save: 'c018ad350813c21f85137726a008224f'
    }
  }

  beforeEach(() => {
    ;['log', 'info'].forEach(logger => {
      jest.spyOn(console, logger).mockImplementation(() => {})
    })
    client = {
      data: {
        defineIndex: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        query: jest.fn().mockResolvedValue([mockedTrigger])
      },
      files: {
        statById: jest.fn().mockResolvedValue(mockedFolder)
      }
    }
  })

  afterEach(() => {
    ;['log', 'info'].forEach(logger => {
      console[logger].mockRestore()
    })
  })

  const expectedAccount = {
    _id: 'c018ad350813c21f85137726a000e61a',
    _rev: '4-716d2b5b432c2c4118c9bec39853e19f',
    auth: {
      accountName: '',
      credentials_encrypted:
        'bmFjbF4ZLYRI0cwAo6rE7iNns+edlqo329ZLgcwhq/Hb1f0U5OpR28CqKu2zfwwb4qFnsLjlXKQECA9x2wWz4Q==',
      folderPath: '/Administrative/Test/claude_cozycloud_cc',
      login: 'claude@cozycloud.cc',
      namePath: 'claude_cozycloud_cc'
    },
    type: 'io.cozy.accounts'
  }

  it('does not update when in dry run mode', async () => {
    await fixAccount(client, expectedAccount)
    expect(client.data.update.mock.calls.length).toBe(0)
  })

  it('does not update regular account', async () => {
    await fixAccount(client, expectedAccount, false)
    expect(client.data.update.mock.calls.length).toBe(0)
  })

  it('removes legacy attribute `dir_id`', async () => {
    const legacyAccount = {
      ...expectedAccount,
      dir_id: 'c018ad350813c21f85137726a000e61b'
    }
    await fixAccount(client, legacyAccount, false)
    expect(client.data.update.mock.calls.length).toBe(1)
    expect(client.data.update.mock.calls[0][2]).toMatchObject(expectedAccount)
  })

  it('removes legacy attribute `folderId`', async () => {
    const legacyAccount = {
      ...expectedAccount,
      folderId: 'c018ad350813c21f85137726a000e61b'
    }
    await fixAccount(client, legacyAccount, false)
    expect(client.data.update.mock.calls.length).toBe(1)
    expect(client.data.update.mock.calls[0][2]).toMatchObject(expectedAccount)
  })

  it('moves misplaced `folderPath` to `auth.folderPath`', async () => {
    const invalidAccount = {
      ...expectedAccount,
      auth: {
        accountName: '',
        credentials_encrypted:
          'bmFjbF4ZLYRI0cwAo6rE7iNns+edlqo329ZLgcwhq/Hb1f0U5OpR28CqKu2zfwwb4qFnsLjlXKQECA9x2wWz4Q==',
        login: 'claude@cozycloud.cc',
        namePath: 'claude_cozycloud_cc'
      },
      folderPath: '/Administrative/Test/claude_cozycloud_cc'
    }
    await fixAccount(client, invalidAccount, false)
    expect(client.data.update.mock.calls.length).toBe(1)
    expect(client.data.update.mock.calls[0][2]).toMatchObject(expectedAccount)
  })

  // This must evolve in the next version of account doctype
  // It's just a fix for now.
  it('moves `folderPath` to `auth.folderPath` for OAuth accounts', async () => {
    const expectedOAuthAccount = {
      _id: 'c018ad350813c21f85137726a000e61a',
      _rev: '4-716d2b5b432c2c4118c9bec39853e19f',
      auth: {
        folderPath: '/Administrative/Test/claude_cozycloud_cc'
      },
      oauth: {
        name: 'Mon Compte Maif',
        access_token: 'akosaksoakso',
        refresh_token: 'okoakozkaozk',
        scope: 'openid profile offline_access'
      },
      type: 'io.cozy.accounts'
    }

    const invalidOAuthAccount = {
      ...expectedOAuthAccount,
      oauth: { ...expectedOAuthAccount.oauth },
      folderPath: '/Administrative/Test/claude_cozycloud_cc'
    }

    delete invalidOAuthAccount.auth

    await fixAccount(client, invalidOAuthAccount, false)
    expect(client.data.update.mock.calls.length).toBe(1)
    expect(client.data.update.mock.calls[0][2]).toMatchObject(
      expectedOAuthAccount
    )
  })

  it('removes `folderPath` if `auth.folderPath` exists', async () => {
    const invalidAccount = {
      ...expectedAccount,
      folderPath: '/Administrative/Should/Be/Ignored'
    }
    await fixAccount(client, invalidAccount, false)
    expect(client.data.update.mock.calls.length).toBe(1)
    expect(client.data.update.mock.calls[0][2]).toMatchObject(expectedAccount)
  })

  it('makes `auth.folderPath` and `auth.namePath` coherent', async () => {
    const invalidAccount = {
      ...expectedAccount,
      auth: {
        ...expectedAccount.auth,
        folderPath: '/Administrative/Test',
        namePath: 'claude_cozycloud_cc'
      }
    }
    await fixAccount(client, invalidAccount, false)
    expect(client.data.update.mock.calls.length).toBe(1)
    expect(client.data.update.mock.calls[0][2]).toMatchObject(expectedAccount)
  })

  it('makes `auth.folderPath` and `auth.namePath` coherent with `/`', async () => {
    const invalidAccount = {
      ...expectedAccount,
      auth: {
        ...expectedAccount.auth,
        folderPath: '/Administrative/Test/',
        namePath: 'claude_cozycloud_cc'
      }
    }
    await fixAccount(client, invalidAccount, false)
    expect(client.data.update.mock.calls.length).toBe(1)
    expect(client.data.update.mock.calls[0][2]).toMatchObject(expectedAccount)
  })

  it('keeps `auth.folderPath` coherent when no `auth.namePath`', async () => {
    const invalidAccount = {
      ...expectedAccount,
      auth: omit(
        {
          ...expectedAccount.auth,
          folderPath: '/Administrative/Test/'
        },
        'namePath'
      )
    }

    await fixAccount(client, invalidAccount, false)
    expect(client.data.update.mock.calls.length).toBe(1)
    expect(client.data.update.mock.calls[0][2]).toMatchObject(expectedAccount)
  })

  describe('`auth.namePath` creation from source fields', async () => {
    const namePathSourceFields = ['accountName', 'login', 'identifier', 'email']

    const expectedAccountBase = {
      ...expectedAccount,
      auth: omit(expectedAccount.auth, namePathSourceFields)
    }

    for (const field of namePathSourceFields) {
      it(`creates \`auth.namePath\` from \`auth.${field}\``, async () => {
        const expectedAccountWithSource = {
          ...expectedAccountBase,
          auth: {
            ...expectedAccountBase.auth,
            [field]: 'claude@cozycloud.cc'
          }
        }

        const invalidAccount = {
          ...expectedAccountWithSource,
          auth: omit(expectedAccountWithSource.auth, 'namePath')
        }

        await fixAccount(client, invalidAccount, false)

        expect(client.data.update.mock.calls.length).toBe(1)
        expect(client.data.update.mock.calls[0][2]).toMatchObject(
          expectedAccountWithSource
        )
      })
    }
  })

  it('does not create namePath when folderPath is expected to be missing', async () => {
    const expectedAccountWithoutNamePath = {
      ...expectedAccount,
      auth: omit(expectedAccount.auth, ['folderPath', 'namePath'])
    }

    // The trigger does not contain any `message.folder_to_save`
    client.data.query.mockResolvedValue([{ message: {} }])

    await fixAccount(client, expectedAccountWithoutNamePath, false)
    expect(client.data.update.mock.calls.length).toBe(0)
  })

  describe('with related trigger', async () => {
    it('restores `auth.folderPath` from related trigger', async () => {
      const invalidAccount = {
        ...expectedAccount,
        auth: omit(expectedAccount.auth, 'folderPath')
      }

      await fixAccount(client, invalidAccount, false)

      expect(client.data.update.mock.calls.length).toBe(1)
      expect(client.data.update.mock.calls[0][2]).toMatchObject(expectedAccount)
    })
  })
})
