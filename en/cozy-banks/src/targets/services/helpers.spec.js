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
})

describe('fetchChangesOrAll', () => {
  class Model {}
  Model.fetchChanges = jest.fn().mockResolvedValue({ newLastSeq: '1234' })
  Model.fetchAll = jest.fn()

  afterEach(() => {
    Model.fetchChanges.mockClear()
    Model.fetchAll.mockClear()
  })

  it('should return all documents if lastSeq is "0"', async () => {
    await fetchChangesOrAll(Model, '0')

    expect(Model.fetchChanges).toHaveBeenCalledWith('', {
      descending: true,
      limit: 1
    })

    expect(Model.fetchAll).toHaveBeenCalled()
  })

  it('should return changes if lastSeq is not "0"', async () => {
    await fetchChangesOrAll(Model, 'abcd')

    expect(Model.fetchChanges).toHaveBeenCalledWith('abcd')
    expect(Model.fetchAll).not.toHaveBeenCalled()
  })
})
