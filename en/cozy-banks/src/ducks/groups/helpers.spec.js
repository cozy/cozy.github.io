import {
  buildAutoGroups,
  getGroupLabel,
  translateAndSortGroups,
  renamedGroup,
  getGroupBalance,
  isLoanGroup
} from './helpers'
import { associateDocuments } from 'ducks/client/utils'
import { ACCOUNT_DOCTYPE } from 'doctypes'

describe('buildAutoGroups', () => {
  it('should generate a virtual group for every account types', () => {
    const accounts = [
      { _id: '1', type: 'Checkings' },
      { _id: '2', type: 'Savings' },
      { _id: '3', type: 'Other' },
      { _id: '4', type: 'TotallyUnkownType' },
      { _id: '5' }
    ]

    const virtualGroups = buildAutoGroups(accounts)

    const checkingsGroup = {
      _id: 'Checkings',
      _type: 'io.cozy.bank.groups',
      label: 'Checkings',
      virtual: true,
      accountType: 'Checkings'
    }

    const savingsGroup = {
      _id: 'Savings',
      _type: 'io.cozy.bank.groups',
      label: 'Savings',
      virtual: true,
      accountType: 'Savings'
    }

    const otherGroup = {
      _id: 'Other',
      _type: 'io.cozy.bank.groups',
      label: 'Other',
      virtual: true,
      accountType: 'Other'
    }

    associateDocuments(checkingsGroup, 'accounts', ACCOUNT_DOCTYPE, [
      accounts[0]
    ])
    associateDocuments(savingsGroup, 'accounts', ACCOUNT_DOCTYPE, [accounts[1]])
    associateDocuments(otherGroup, 'accounts', ACCOUNT_DOCTYPE, [
      accounts[2],
      accounts[3],
      accounts[4]
    ])

    const expected = [checkingsGroup, savingsGroup, otherGroup]

    expect(virtualGroups).toEqual(expected)
  })
})

describe('translateGroup', () => {
  const translate = jest.fn(key => key)

  afterEach(() => {
    translate.mockReset()
  })

  it("should translate the group label only if it's a virtual group", () => {
    const virtualGroup = {
      virtual: true,
      label: 'Checkings',
      accountType: 'Checkings'
    }

    const normalGroup = {
      virtual: false,
      label: 'Checkings'
    }

    expect(getGroupLabel(virtualGroup, translate)).toEqual(
      'Data.accountTypes.Checkings'
    )
    expect(getGroupLabel(normalGroup, translate)).toEqual(normalGroup.label)
  })
})

describe('translateAndSortGroups', () => {
  const translate = jest.fn(key => key)

  afterEach(() => {
    translate.mockClear()
  })

  const setup = groups => {
    // Merge translated label into the group for easier testing
    return translateAndSortGroups(groups, translate).map(groupAndLabel => ({
      ...groupAndLabel.group,
      label: groupAndLabel.label
    }))
  }

  it('should sort groups by translated label', () => {
    const groups = [
      { virtual: true, accountType: 'C', label: 'C' },
      { virtual: false, label: 'A' },
      { virtual: false, label: 'B' },
      { virtual: false, label: 'Z' },
      { virtual: false, label: 'é' }
    ]

    const expected = [
      { virtual: false, label: 'A' },
      { virtual: false, label: 'B' },
      { virtual: true, label: 'Data.accountTypes.C', accountType: 'C' },
      { virtual: false, label: 'é' },
      { virtual: false, label: 'Z' }
    ]

    expect(setup(groups)).toEqual(expected)
  })

  it('should put group with label "Other" at the end', () => {
    const groups = [
      { virtual: false, label: 'B' },
      { virtual: false, label: 'A' },
      { virtual: true, label: 'Other', accountType: 'Other' },
      { virtual: true, label: 'Z', accountType: 'Z' }
    ]

    const expected = [
      { virtual: false, label: 'A' },
      { virtual: false, label: 'B' },
      { virtual: true, label: 'Data.accountTypes.Z', accountType: 'Z' },
      { virtual: true, label: 'Data.accountTypes.Other', accountType: 'Other' }
    ]

    expect(setup(groups)).toEqual(expected)
  })

  it('should put reimbursements virtual group at the end', () => {
    const groups = [
      { virtual: false, label: 'A' },
      { _id: 'Reimbursements', virtual: true, label: 'Reimbursements' },
      { virtual: true, label: 'Other', accountType: 'Other' },
      { virtual: true, label: 'Z', accountType: 'Z' }
    ]

    const expected = [
      { virtual: false, label: 'A' },
      { virtual: true, label: 'Data.accountTypes.Z', accountType: 'Z' },
      { virtual: true, label: 'Data.accountTypes.Other', accountType: 'Other' },
      {
        _id: 'Reimbursements',
        virtual: true,
        label: 'Data.accountTypes.Reimbursements'
      }
    ]

    expect(setup(groups)).toEqual(expected)
  })
})

describe('when the given group has an accountType', () => {
  it('should not set accountType to null', () => {
    const group = { accountType: 'checkings' }

    expect(renamedGroup(group, 'My super group')).toEqual({
      label: 'My super group',
      accountType: null
    })
  })
})

describe('when the given group does not have an accountType', () => {
  it('should not set accountType to null', () => {
    const group = { label: 'My group' }

    expect(renamedGroup(group, 'My super group')).toEqual({
      label: 'My super group'
    })
  })
})

describe('getGroupBalance', () => {
  it('should return 0 if no group is given', () => {
    expect(getGroupBalance()).toBe(0)
  })

  it('should return 0 if the group has no account', () => {
    expect(getGroupBalance({ accounts: null })).toBe(0)
    expect(getGroupBalance({ accounts: { data: null } })).toBe(0)
  })

  it('should return the sum of all accounts balance', () => {
    const accounts = [{ balance: 1000 }, { balance: -100 }, { balance: 8000 }]
    const group = { accounts: { data: accounts } }

    expect(getGroupBalance(group)).toBe(8900)
  })

  it('should not sum the excluded accounts balance', () => {
    const accounts = [
      { _id: 'a', balance: 1000 },
      { _id: 'b', balance: -100 },
      { _id: 'c', balance: 8000 }
    ]

    const group = { accounts: { data: accounts } }
    const excludedAccounts = ['a', 'c']

    expect(getGroupBalance(group, excludedAccounts)).toBe(-100)
  })

  it('should return 0 if the group has no account', () => {
    const group = { accounts: { data: [] } }

    expect(getGroupBalance(group)).toBe(0)
  })
})

describe('isLoanGroup', () => {
  it('should return false if group is not yet hydrated', () => {
    expect(
      isLoanGroup({
        accounts: ['1', '2', '3']
      })
    ).toBe(false)
  })

  it('should return true if every account is a loan', () => {
    expect(
      isLoanGroup({
        accounts: {
          data: [
            {
              type: 'ConsumerCredit'
            }
          ]
        }
      })
    ).toBe(true)
  })

  it('should return false if one account is not a loan', () => {
    expect(
      isLoanGroup({
        accounts: {
          data: [
            {
              type: 'ConsumerCredit'
            },
            {
              type: 'CreditCard'
            },
            null
          ]
        }
      })
    ).toBe(false)
  })
})
