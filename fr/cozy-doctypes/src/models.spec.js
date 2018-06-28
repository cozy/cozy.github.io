const { Document, BankAccount, BankTransaction } = require('.')

describe('Document', () => {
  let cozyClient
  beforeAll(() => {
    cozyClient = {
      data: {
        defineIndex: jest.fn(),
        query: jest.fn(),
        updateAttributes: jest.fn(),
        create: jest.fn()
      },
      fetchJSON: jest.fn().mockReturnValue({ rows: [] })
    }
    Document.registerClient(cozyClient)
  })

  afterAll(() => {
    Document.registerClient(null)
  })

  class Simpson extends Document {}
  Simpson.doctype = 'io.cozy.simpsons'

  beforeEach(() => {
    cozyClient.fetchJSON.mockClear()
  })

  it('should do bulk fetch', async () => {
    await Simpson.fetchAll()
    expect(cozyClient.fetchJSON).toHaveBeenCalledWith(
      'GET',
      '/data/io.cozy.simpsons/_all_docs?include_docs=true'
    )
  })

  it('should do bulk delete', async () => {
    await Simpson.deleteAll([
      { _id: 1, name: 'Marge' },
      { _id: 2, name: 'Homer' }
    ])
    expect(cozyClient.fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/data/io.cozy.simpsons/_bulk_docs',
      {
        docs: [
          { _deleted: true, _id: 1, name: 'Marge' },
          { _deleted: true, _id: 2, name: 'Homer' }
        ]
      }
    )
  })
})

describe('transaction reconciliation', () => {
  it('should be able to filter incoming linxo transactions on their date', () => {
    const filter = x => BankTransaction.prototype.isAfter.call(x, '2018-10-04')
    expect(filter({ date: new Date('2018-10-03').toISOString() })).toBe(false) // midnight
    expect(filter({ date: new Date('2018-10-02').toISOString() })).toBe(false) // day before
    expect(filter({ date: new Date('2018-10-05').toISOString() })).toBe(true) // day after
  })
})

describe('account reconciliation', () => {
  it('should correctly determine if we are saving from a new linxo account', () => {
    expect(
      BankAccount.isFromNewKonnector(
        [{ vendorId: 1, number: 1 }],
        [{ vendorId: 1, number: 1 }]
      )
    ).toBe(false)
    expect(
      BankAccount.isFromNewKonnector(
        [{ vendorId: 2, number: 1 }],
        [{ vendorId: 1, number: 1 }]
      )
    ).toBe(true)
  })
  it('should correctly match linxo accounts to cozy accounts through number', () => {
    const localAccounts = [{ _id: 'a1', number: '1', balance: 50 }]
    const remoteAccounts = [
      { number: '1', balance: 100 },
      { number: '2', balance: 200 }
    ]
    const matchedAccounts = BankAccount.reconciliate(
      remoteAccounts,
      localAccounts
    )
    expect(matchedAccounts[0]._id).toBe('a1')
    expect(matchedAccounts[1]._id).toBe(undefined)
  })
})
