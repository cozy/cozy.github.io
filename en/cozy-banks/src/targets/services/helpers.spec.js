import CozyStackClient from 'cozy-stack-client'
import DocumentCollection from 'cozy-stack-client/dist/DocumentCollection'
import { getOptions, fetchChangesOrAll } from './helpers'

describe('getOptions', () => {
  let client
  let env

  beforeEach(() => {
    client = {
      fetchJSON: jest.fn()
    }

    env = { COZY_JOB_ID: 'service/1/abcd' }
  })

  it('should return an empty object if no option is given', async () => {
    client.fetchJSON.mockResolvedValueOnce({})
    const argv = []

    const options = await getOptions(client, env, argv)

    expect(options).toEqual({})
  })

  it('should return the options given in the env', async () => {
    client.fetchJSON.mockResolvedValueOnce({
      attributes: {
        message: {
          arguments: {
            billsMatching: false,
            transactionsMatching: false
          }
        }
      }
    })

    const argv = []
    const options = await getOptions(client, env, argv)

    expect(options).toEqual({
      billsMatching: false,
      transactionsMatching: false
    })
  })

  it('should return the options given in the CLI', async () => {
    client.fetchJSON.mockResolvedValueOnce({})
    const argv = ['{"billsMatching": false, "transactionsMatching": false}']

    const options = await getOptions(client, env, argv)

    expect(options).toEqual({
      billsMatching: false,
      transactionsMatching: false
    })
  })

  it('should merge options given in the env and in the CLI', async () => {
    client.fetchJSON.mockResolvedValueOnce({
      attributes: {
        message: {
          arguments: {
            billsMatching: false,
            transactionsMatching: false
          }
        }
      }
    })

    const argv = [
      '{"billsMatching": { "lastSeq": "0" }, "transactionsMatching": false}'
    ]

    const options = await getOptions(client, env, argv)

    expect(options).toEqual({
      billsMatching: {
        lastSeq: '0'
      },
      transactionsMatching: false
    })
  })

  it('should not crash if no job is has been passed in env vars', async () => {
    client.fetchJSON.mockResolvedValueOnce({})
    const argv = [
      '{"billsMatching": { "lastSeq": "0" }, "transactionsMatching": false}'
    ]
    env.COZY_JOB_ID = undefined

    const options = await getOptions(client, env, argv)

    expect(options).toEqual({
      billsMatching: {
        lastSeq: '0'
      },
      transactionsMatching: false
    })
  })
})

describe('fetchChangesOrAll', () => {
  const client = new CozyStackClient()

  beforeEach(() => {
    jest
      .spyOn(DocumentCollection.prototype, 'fetchChanges')
      .mockResolvedValue({ newLastSeq: '1234' })
    jest
      .spyOn(DocumentCollection.prototype, 'all')
      .mockResolvedValue({ newLastSeq: '1234' })
  })

  afterEach(() => {
    DocumentCollection.prototype.fetchChanges.mockClear()
    DocumentCollection.prototype.all.mockClear()
  })

  it('should return all documents if lastSeq is "0"', async () => {
    await fetchChangesOrAll(client, 'io.cozy.todos', '0')

    expect(DocumentCollection.prototype.fetchChanges).toHaveBeenCalledWith({
      since: '',
      descending: true,
      limit: 1
    })

    expect(DocumentCollection.prototype.all).toHaveBeenCalledWith({
      limit: null
    })
  })

  it('should return changes if lastSeq is not "0"', async () => {
    await fetchChangesOrAll(client, 'io.cozy.todos', 'abcd')

    expect(DocumentCollection.prototype.fetchChanges).toHaveBeenCalledWith({
      since: 'abcd',
      include_docs: true
    })
    expect(DocumentCollection.prototype.all).not.toHaveBeenCalled()
  })
})
