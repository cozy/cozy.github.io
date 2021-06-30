import multiKeyBy from './multiKeyBy'
import fixtures from 'test/fixtures/unit-tests.json'

describe('multiKeyBy', () => {
  it('should work on empty array', () => {
    expect(multiKeyBy([], group => group.accounts)).toEqual({})
    expect(multiKeyBy(null, group => group.accounts)).toEqual({})
  })

  it('should work on array', () => {
    const groups = fixtures['io.cozy.bank.groups']
    const groupsByAccountId = multiKeyBy(groups, group => group.accounts)
    expect(groupsByAccountId['compteisa1'].map(x => x._id)).toEqual([
      'familleelargie',
      'isabelle'
    ])
    expect(groupsByAccountId['comptecla1'].map(x => x._id)).toEqual([
      'familleelargie'
    ])
    expect(groupsByAccountId['comptelou1'].map(x => x._id)).toEqual([
      'familleelargie',
      'isabelle'
    ])
    expect(Object.keys(groupsByAccountId).length).toEqual(5)
  })
})
