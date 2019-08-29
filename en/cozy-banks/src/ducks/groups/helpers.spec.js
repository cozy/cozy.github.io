import {
  buildVirtualGroups,
  translateGroup,
  translateAndSortGroups
} from './helpers'
import { associateDocuments } from 'ducks/client/utils'
import { ACCOUNT_DOCTYPE } from 'doctypes'

describe('buildVirtualGroups', () => {
  it('should generate a virtual group for every account types', () => {
    const accounts = [
      { _id: '1', type: 'Checkings' },
      { _id: '2', type: 'Savings' },
      { _id: '3', type: 'Other' },
      { _id: '4', type: 'TotallyUnkownType' },
      { _id: '5' }
    ]

    const virtualGroups = buildVirtualGroups(accounts)

    const checkingsGroup = {
      _id: 'Checkings',
      _type: 'io.cozy.bank.groups',
      label: 'Checkings',
      virtual: true
    }

    const savingsGroup = {
      _id: 'Savings',
      _type: 'io.cozy.bank.groups',
      label: 'Savings',
      virtual: true
    }

    const otherGroup = {
      _id: 'Other',
      _type: 'io.cozy.bank.groups',
      label: 'Other',
      virtual: true
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
      label: 'label'
    }

    const normalGroup = {
      virtual: false,
      label: 'label'
    }

    expect(translateGroup(virtualGroup, translate)).toEqual({
      ...virtualGroup,
      label: 'Data.accountTypes.label'
    })
    expect(translateGroup(normalGroup, translate)).toEqual(normalGroup)
  })
})

describe('translateAndSortGroups', () => {
  const translate = jest.fn(key => key)

  afterEach(() => {
    translate.mockClear()
  })

  it('should sort groups by translated label', () => {
    const groups = [
      { virtual: true, label: 'C' },
      { virtual: false, label: 'A' },
      { virtual: false, label: 'B' },
      { virtual: false, label: 'Z' },
      { virtual: false, label: 'é' }
    ]

    const expected = [
      { virtual: false, label: 'A' },
      { virtual: false, label: 'B' },
      { virtual: true, label: 'Data.accountTypes.C' },
      { virtual: false, label: 'é' },
      { virtual: false, label: 'Z' }
    ]

    expect(translateAndSortGroups(groups, translate)).toEqual(expected)
  })

  it('should put group with label "Other" at the end', () => {
    const groups = [
      { virtual: false, label: 'B' },
      { virtual: false, label: 'A' },
      { virtual: true, label: 'Other' },
      { virtual: true, label: 'Z' }
    ]

    const expected = [
      { virtual: false, label: 'A' },
      { virtual: false, label: 'B' },
      { virtual: true, label: 'Data.accountTypes.Z' },
      { virtual: true, label: 'Data.accountTypes.Other' }
    ]

    expect(translateAndSortGroups(groups, translate)).toEqual(expected)
  })

  it('should put reimbursements virtual group at the end', () => {
    const groups = [
      { virtual: false, label: 'A' },
      { _id: 'Reimbursements', virtual: true, label: 'Reimbursements' },
      { virtual: true, label: 'Other' },
      { virtual: true, label: 'Z' }
    ]

    const expected = [
      { virtual: false, label: 'A' },
      { virtual: true, label: 'Data.accountTypes.Z' },
      { virtual: true, label: 'Data.accountTypes.Other' },
      {
        _id: 'Reimbursements',
        virtual: true,
        label: 'Data.accountTypes.Reimbursements'
      }
    ]

    expect(translateAndSortGroups(groups, translate)).toEqual(expected)
  })
})
