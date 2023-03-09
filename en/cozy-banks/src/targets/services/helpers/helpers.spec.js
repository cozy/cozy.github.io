import CozyClient from 'cozy-client'
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
  const client = new CozyClient()
  const documentCollection = jest.fn()

  beforeEach(() => {
    documentCollection.fetchChanges = jest
      .fn()
      .mockResolvedValue({ documents: [], newLastSeq: '1234' })
    documentCollection.all = jest
      .fn()
      .mockResolvedValue({ data: [], newLastSeq: '1234' })
    jest.spyOn(client, 'collection').mockReturnValue(documentCollection)
  })

  afterEach(() => {
    documentCollection.fetchChanges.mockClear()
    documentCollection.all.mockClear()
  })

  it('should return all documents if lastSeq is "0"', async () => {
    const res = await fetchChangesOrAll(client, 'io.cozy.todos', '0')

    expect(documentCollection.fetchChanges).toHaveBeenCalledWith({
      since: '',
      descending: true,
      limit: 1
    })

    expect(documentCollection.all).toHaveBeenCalledWith({
      limit: null
    })

    expect(res).toStrictEqual({ documents: [], newLastSeq: '1234' })
  })

  it('should return changes if lastSeq is not "0"', async () => {
    const res = await fetchChangesOrAll(client, 'io.cozy.todos', 'abcd')

    expect(documentCollection.fetchChanges).toHaveBeenCalledWith({
      since: 'abcd',
      include_docs: true
    })
    expect(documentCollection.all).not.toHaveBeenCalled()
    expect(res).toStrictEqual({ documents: [], newLastSeq: '1234' })
  })
})
