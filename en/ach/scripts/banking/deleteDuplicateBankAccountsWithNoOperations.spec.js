const {
  findDuplicateAccounts,
  hasNoOperations
} = require('./deleteDuplicateBankAccountsWithNoOperations')

jest.mock('../../libs/log', () => ({
  info: jest.fn()
}))

describe('deleteDuplicateBankAccountsWithNoOperations', () => {
  it('should return duplicate with no operations', () => {
    const accounts = [
      { _id: 'empty', label: 'Duplicate account', institutionLabel: 'i1' },
      { _id: 'filled', label: 'Duplicate account', institutionLabel: 'i1' },
      {
        _id: 'filled_not_duplicate',
        label: 'Account with ops',
        institutionLabel: 'i1'
      },
      {
        _id: 'duplicate_across_institution',
        label: 'Duplicate account',
        institutionLabel: 'i2'
      }
    ]

    const operations = [
      { _id: 'op1', account: 'filled' },
      { _id: 'op2', account: 'filled' },
      { _id: 'op3', account: 'filled' },
      { _id: 'op4', account: 'filled' },
      { _id: 'op5', account: 'filled_not_duplicate' },
      { _id: 'op6', account: 'filled_not_duplicate' },
      { _id: 'op7', account: 'filled_not_duplicate' }
    ]
    const duplicateAccounts = findDuplicateAccounts(accounts)
    expect(duplicateAccounts.map(x => x._id)).toEqual(['empty', 'filled'])

    const withoutOps = duplicateAccounts.filter(hasNoOperations(operations))
    expect(withoutOps.map(x => x._id)).toEqual(['empty'])
  })
})
