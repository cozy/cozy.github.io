const MockDate = require('mockdate')

const utils = require('../../libs/utils')
const migrateContactsV1toV2 = require('./migrateContactsV1toV2')

jest.mock('../../libs/utils')

const fetchJSONSpy = jest.fn()

const JOHN_CONTACT_ACCOUNT_ID = 'ee942dd5-a562-40b4-864d-162563985639'
const JANE_CONTACT_ACCOUNT_ID = 'b8ac66b5-867d-47aa-bab2-bcd9b81cb9ad'
const MOCKED_DATE = '2017-03-04T08:28:24.054Z'

const contactsFixture = {
  rows: [
    // contact imported from google:
    {
      id: '0241b297-0df8-4137-a072-30d1736b0cc4',
      doc: {
        name: { familyName: 'Runolfsson', givenName: 'Carole' },
        phone: [],
        email: [],
        address: [],
        metadata: {
          version: 1,
          google: {
            metadata: {},
            from: 'john@gmail.com'
          }
        },
        vendorId: 'people/10444765419'
      }
    },
    // another contact imported from google (same account):
    {
      id: 'a0a9fb5d-70ac-412d-b923-74dbed191086',
      doc: {
        name: { familyName: 'Mathew', givenName: 'Cruickshank' },
        phone: [],
        email: [],
        address: [],
        metadata: {
          version: 1,
          google: {
            metadata: {},
            from: 'john@gmail.com'
          }
        },
        vendorId: 'people/1277932194'
      }
    },
    // contact imported from another google account:
    {
      id: 'bae637b9-916b-41d1-9e07-cbb59b710a3d',
      doc: {
        name: { familyName: 'Cydney', givenName: 'Brown' },
        phone: [],
        email: [],
        address: [],
        metadata: {
          version: 1,
          google: {
            metadata: {},
            from: 'jane@gmail.com'
          }
        },
        vendorId: 'people/478836760'
      }
    },
    // contact created in Contacts app:
    {
      id: '62726133-20a0-4d3b-bd2f-bf67836e81d9',
      doc: {
        name: { familyName: 'Emilia', givenName: 'Hilpert' },
        phone: [],
        email: [],
        address: [],
        metadata: {
          cozy: true,
          version: 1
        }
      }
    },
    // contact imported from vcard
    {
      id: '6ce9fc8c-d1ce-49e5-bfc7-be263c55e606',
      doc: {
        name: { familyName: 'Hector', givenName: 'Stark' },
        phone: [],
        email: [],
        address: [],
        metadata: {
          version: 1
        }
      }
    }
  ]
}

beforeAll(() => {
  MockDate.set(MOCKED_DATE)
})

afterAll(() => {
  MockDate.reset()
})

describe('Contacts: migrate contacts v1 to v2', () => {
  const fakeClient = {
    fetchJSON: fetchJSONSpy
  }
  const fakeACH = {
    oldClient: fakeClient
  }
  const logWithInstanceSpy = jest.fn()

  beforeEach(() => {
    utils.getWithInstanceLogger.mockReturnValue(logWithInstanceSpy)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should migrate cozy contacts', async () => {
    // create io.cozy.contacts.accounts doctype
    fetchJSONSpy.mockResolvedValueOnce({ ok: true })

    // fetch contacts
    fetchJSONSpy.mockResolvedValueOnce(contactsFixture)

    // create contact accounts
    fetchJSONSpy.mockResolvedValueOnce([
      { ok: true, id: JOHN_CONTACT_ACCOUNT_ID, rev: 'rd7e7f3a6' },
      { ok: true, id: JANE_CONTACT_ACCOUNT_ID, rev: 'r3b01928b' }
    ])

    // fetch contact accounts
    fetchJSONSpy.mockResolvedValueOnce({
      rows: [
        {
          id: JOHN_CONTACT_ACCOUNT_ID,
          doc: {
            _id: JOHN_CONTACT_ACCOUNT_ID,
            name: 'john@gmail.com'
          }
        },
        {
          id: JANE_CONTACT_ACCOUNT_ID,
          doc: {
            _id: JANE_CONTACT_ACCOUNT_ID,
            name: 'jane@gmail.com'
          }
        }
      ]
    })

    await migrateContactsV1toV2.run(fakeACH, false)

    expect(fetchJSONSpy).toHaveBeenCalledTimes(5)

    const expectedDocs = [
      {
        cozyMetadata: {
          doctypeVersion: 2,
          createdAt: undefined,
          createdByApp: 'konnector-google',
          createdByAppVersion: undefined,
          updatedByApps: [
            {
              date: MOCKED_DATE,
              slug: 'konnector-google'
            }
          ],
          updatedAt: MOCKED_DATE,
          sourceAccount: null,
          sync: {
            [JOHN_CONTACT_ACCOUNT_ID]: {
              konnector: 'konnector-google',
              lastSync: MOCKED_DATE,
              contactsAccountsId: JOHN_CONTACT_ACCOUNT_ID,
              id: 'people/10444765419',
              remoteRev: undefined
            }
          }
        },
        me: false,
        name: { familyName: 'Runolfsson', givenName: 'Carole' },
        phone: [],
        email: [],
        address: [],
        metadata: {
          google: { metadata: {}, from: 'john@gmail.com' }
        },
        relationships: {
          accounts: {
            data: [
              {
                _id: JOHN_CONTACT_ACCOUNT_ID,
                _type: 'io.cozy.contacts.accounts'
              }
            ]
          }
        }
      },
      {
        cozyMetadata: {
          doctypeVersion: 2,
          createdAt: undefined,
          createdByApp: 'konnector-google',
          createdByAppVersion: undefined,
          updatedByApps: [
            {
              date: MOCKED_DATE,
              slug: 'konnector-google'
            }
          ],
          updatedAt: MOCKED_DATE,
          sourceAccount: null,
          sync: {
            [JOHN_CONTACT_ACCOUNT_ID]: {
              konnector: 'konnector-google',
              lastSync: MOCKED_DATE,
              contactsAccountsId: JOHN_CONTACT_ACCOUNT_ID,
              id: 'people/1277932194',
              remoteRev: undefined
            }
          }
        },
        me: false,
        name: { familyName: 'Mathew', givenName: 'Cruickshank' },
        phone: [],
        email: [],
        address: [],
        metadata: {
          google: { metadata: {}, from: 'john@gmail.com' }
        },
        relationships: {
          accounts: {
            data: [
              {
                _id: JOHN_CONTACT_ACCOUNT_ID,
                _type: 'io.cozy.contacts.accounts'
              }
            ]
          }
        }
      },
      {
        cozyMetadata: {
          doctypeVersion: 2,
          createdAt: undefined,
          createdByApp: 'konnector-google',
          createdByAppVersion: undefined,
          updatedByApps: [
            {
              date: MOCKED_DATE,
              slug: 'konnector-google'
            }
          ],
          updatedAt: MOCKED_DATE,
          sourceAccount: null,
          sync: {
            [JANE_CONTACT_ACCOUNT_ID]: {
              konnector: 'konnector-google',
              lastSync: MOCKED_DATE,
              contactsAccountsId: JANE_CONTACT_ACCOUNT_ID,
              id: 'people/478836760',
              remoteRev: undefined
            }
          }
        },
        me: false,
        name: { familyName: 'Cydney', givenName: 'Brown' },
        phone: [],
        email: [],
        address: [],
        metadata: {
          google: { metadata: {}, from: 'jane@gmail.com' }
        },
        relationships: {
          accounts: {
            data: [
              {
                _id: JANE_CONTACT_ACCOUNT_ID,
                _type: 'io.cozy.contacts.accounts'
              }
            ]
          }
        }
      },
      {
        cozyMetadata: {
          doctypeVersion: 2,
          createdAt: undefined,
          createdByApp: 'Contacts',
          createdByAppVersion: undefined,
          updatedByApps: [
            {
              date: MOCKED_DATE,
              slug: 'Contacts',
              version: undefined
            }
          ],
          updatedAt: MOCKED_DATE,
          sourceAccount: null,
          sync: undefined
        },
        me: false,
        name: { familyName: 'Emilia', givenName: 'Hilpert' },
        phone: [],
        email: [],
        address: [],
        relationships: {
          accounts: {
            data: []
          }
        }
      },
      {
        cozyMetadata: {
          doctypeVersion: 2,
          createdAt: undefined,
          createdByApp: 'Contacts',
          createdByAppVersion: undefined,
          updatedByApps: [
            {
              date: MOCKED_DATE,
              slug: 'Contacts',
              version: undefined
            }
          ],
          updatedAt: MOCKED_DATE,
          sourceAccount: null,
          sync: undefined
        },
        me: false,
        name: { familyName: 'Hector', givenName: 'Stark' },
        phone: [],
        email: [],
        address: [],
        relationships: {
          accounts: {
            data: []
          }
        }
      }
    ]
    expect(fetchJSONSpy).toHaveBeenNthCalledWith(
      5,
      'POST',
      '/data/io.cozy.contacts/_bulk_docs',
      { docs: expectedDocs }
    )
  })

  it('should not update data in dry run mode', async () => {
    fetchJSONSpy.mockResolvedValueOnce(contactsFixture)

    await migrateContactsV1toV2.run(fakeACH, true)

    expect(fetchJSONSpy).toHaveBeenCalledTimes(1)
    expect(fetchJSONSpy.mock.calls[0][0]).toEqual('GET')
    expect(logWithInstanceSpy).toHaveBeenCalledTimes(5)
  })

  it("should do nothing if io.cozy.contacts.accounts doctype can't be created", async () => {
    fetchJSONSpy.mockResolvedValueOnce({ ok: false })

    await migrateContactsV1toV2.run(fakeACH, false)

    expect(fetchJSONSpy).toHaveBeenCalledTimes(1)
    expect(fetchJSONSpy.mock.calls[0][0]).toEqual('PUT')
    expect(logWithInstanceSpy).toHaveBeenCalledTimes(1)
    expect(logWithInstanceSpy).toHaveBeenCalledWith(
      'Failed to create io.cozy.contacts.accounts'
    )
  })
})
