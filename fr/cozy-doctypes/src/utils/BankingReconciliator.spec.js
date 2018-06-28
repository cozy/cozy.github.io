const BankingReconciliator = require('./BankingReconciliator')
const { Document, BankAccount, BankTransaction } = require('..')

describe('banking reconciliator', () => {
  let reconciliator

  let existingAccounts, existingTransactions

  beforeEach(() => {
    let _id = 1
    BankAccount.fetchAll = jest
      .fn()
      .mockImplementation(() => Promise.resolve(existingAccounts))
    Document.createOrUpdate = jest
      .fn()
      .mockImplementation(attrs => Promise.resolve({ ...attrs, _id: _id++ }))
    BankTransaction.getMostRecentForAccounts = jest
      .fn()
      .mockImplementation(() => Promise.resolve(existingTransactions))
    reconciliator = new BankingReconciliator({ BankAccount, BankTransaction })
  })

  it('should correctly reconciliate when accounts do not exist', async () => {
    existingAccounts = []
    existingTransactions = []
    await reconciliator.save(
      [
        {
          vendorId: 1,
          balance: 1000,
          label: 'Bank account 1'
        }
      ],
      [
        {
          amount: -100,
          label: 'Debit 100',
          vendorAccountId: 1,
          date: '2018-06-27T00:00'
        }
      ]
    )
    expect(Document.createOrUpdate).toHaveBeenCalledTimes(2)
  })

  it('should correctly reconciliate when accounts do not exist', async () => {
    existingAccounts = [
      {
        vendorId: 1,
        number: 1,
        _id: 123,
        balance: 2000,
        label: 'Bank account 1'
      }
    ]
    existingTransactions = [
      {
        vendorAccountId: 1,
        vendorId: 123,
        date: '2018-06-25T00:00',
        label: 'Debit 200',
        amount: -200
      }
    ]
    await reconciliator.save(
      [
        {
          number: 1, // existing account
          vendorId: 2, // from a new connector account
          balance: 1000,
          label: 'Bank account 1'
        }
      ],
      [
        {
          amount: -200,
          label: 'Debit 200',
          vendorAccountId: 2,
          date: '2018-06-24T00:00' // prior to split date, not saved
        },
        {
          amount: -100,
          label: 'Debit 100',
          vendorAccountId: 2,
          date: '2018-06-27T00:00'
        }
      ]
    )
    expect(Document.createOrUpdate).toHaveBeenCalledTimes(2)
    expect(Document.createOrUpdate.mock.calls).toMatchSnapshot()
  })
})
