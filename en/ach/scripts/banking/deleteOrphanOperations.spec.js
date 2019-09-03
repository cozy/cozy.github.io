const api = require('../api')
const { run } = require('./deleteOrphanOperations')

const makeDoc = (id, doc) => ({ id, doc: { _id: id, ...doc } })

const operations = [
  makeDoc('o1', { account: 'a1' }),
  makeDoc('o2', { account: 'a2' }),
  makeDoc('o3', { account: 'a3' }),
  makeDoc('o4', { account: 'a3' }),
  makeDoc('o5', { account: 'a2' }),
  makeDoc('o5', { account: 'a2' }),
  makeDoc('o6', { account: 'a3' }),
  makeDoc('o7', { account: 'a2' }),
  makeDoc('o8', { account: 'a4' }),
  makeDoc('o9', { account: 'a5' }),
  makeDoc('o10', { account: 'a5' })
]

const accounts = [makeDoc('a1'), makeDoc('a2'), makeDoc('a4')]

describe('delete orphan operations', () => {
  let client
  beforeEach(() => {
    client = {
      fetchJSON: jest.fn()
    }
    api.fetchAll = jest.fn().mockImplementation(doctype => {
      return doctype === 'io.cozy.bank.accounts' ? accounts : operations
    })
    api.deleteAll = jest.fn()
  })

  it('should not delete in dry run', async () => {
    await run({ client })
    expect(api.deleteAll).not.toHaveBeenCalled()
  })

  it('should delete operations whose account does not exist', async () => {
    await run({ client }, false)
    expect(api.deleteAll).toHaveBeenCalledWith('io.cozy.bank.operations', [
      { _id: 'o3', account: 'a3' },
      { _id: 'o4', account: 'a3' },
      { _id: 'o6', account: 'a3' },
      { _id: 'o9', account: 'a5' },
      { _id: 'o10', account: 'a5' }
    ])
  })
})
