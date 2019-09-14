const { createJob } = require('./transfers')

describe('create job', () => {
  const setup = () => {
    const accountCollection = {
      create: jest
        .fn()
        .mockResolvedValue({ data: { _id: 'temporary-account-id' } })
    }
    const permissionCollection = {
      add: jest.fn().mockResolvedValue({ _id: 'permission-id' })
    }
    const konnectorCollection = {
      all: jest.fn().mockResolvedValue({
        data: [
          { _id: 'io.cozy.konnectors/test-konnector' },
          { _id: 'io.cozy.konnectors/hellobank145' }
        ]
      })
    }
    const client = {
      collection: doctype => {
        if (doctype === 'io.cozy.accounts') {
          return accountCollection
        } else if (doctype == 'io.cozy.permissions') {
          return permissionCollection
        } else if (doctype == 'io.cozy.konnectors') {
          return konnectorCollection
        } else {
          throw new Error(
            `Tried to create a ${doctype} collection, should not happen during transfer job creation.`
          )
        }
      },
      stackClient: {
        jobs: {
          create: jest.fn()
        }
      }
    }
    return {
      client,
      accountCollection,
      permissionCollection,
      konnectorCollection
    }
  }

  it('should call the stack client with the right args', async () => {
    const { client } = setup()
    const options = {
      amount: 10,
      recipientId: 'recipientId-1234',
      senderAccount: {
        _id: 'senderAccount-4567',
        cozyMetadata: { createdByApp: 'test-konnector' }
      },
      password: 'my-secret',
      label: 'test-transfer',
      executionDate: '2019-05-11'
    }
    await createJob(client, options)
    expect(client.stackClient.jobs.create).toHaveBeenCalledWith('konnector', {
      amount: 10,
      executionDate: '2019-05-11',
      konnector: 'test-konnector',
      label: 'test-transfer',
      mode: 'transfer',
      recipientId: 'recipientId-1234',
      senderAccountId: 'senderAccount-4567',
      temporaryAccountId: 'temporary-account-id'
    })
  })

  it('should fail if it does not find the right konnector', async () => {
    const { client, konnectorCollection } = setup()
    const options = {
      amount: 10,
      recipientId: 'recipientId-1234',
      senderAccount: {
        _id: 'senderAccount-4567',
        cozyMetadata: { createdByApp: 'test-konnector' }
      },
      password: 'my-secret',
      label: 'test-transfer',
      executionDate: '2019-05-11'
    }
    konnectorCollection.all.mockResolvedValue({ data: [] })
    await expect(createJob(client, options)).rejects.toEqual(
      new Error('Could not find suitable konnector for slug: test-konnector')
    )
  })
})
