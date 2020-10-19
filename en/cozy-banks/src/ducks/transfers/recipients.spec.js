import omit from 'lodash/omit'
import {
  groupAsBeneficiary,
  createCategoryFilter,
  findAccount
} from './recipients'

const recipients = [
  {
    category: 'internal',
    label: 'My account',
    iban: 'FR763000401390000003341337',
    vendorAccountId: 1
  },
  {
    category: 'internal',
    label: 'My account',
    iban: 'FR763000401390000003341337',
    vendorAccountId: 2
  },
  {
    category: 'external',
    label: 'External 1',
    iban: 'FR763',
    vendorAccountId: 3
  },
  {
    category: 'external',
    label: 'External 1',
    iban: 'FR763',
    vendorAccountId: 4
  },
  {
    category: 'external',
    label: 'External 2',
    iban: 'FR7630004013900003022755575',
    vendorAccountId: 5
  }
]
const accounts = [
  {
    iban: 'FR763000401390000003341337',
    number: '4013900000033413',
    label: 'My account',
    balance: 500,
    vendorId: 1
  },
  { iban: 'FR7630004013900003022755575', label: 'External 2', balance: 500 }
]

describe('recipient utils', () => {
  const rec = recipients[0]

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.warn.mockReset()
  })

  describe('account matching', () => {
    it('should match an account to a recipient via accountId', () => {
      expect(findAccount(rec, accounts)).toBe(accounts[0])
    })

    it('should match an account to a recipient via iban', () => {
      expect(findAccount(omit(rec, 'vendorAccountId'), accounts)).toBe(
        accounts[0]
      )
    })

    it('should match an account to a recipient via number', () => {
      const withoutIban = omit(accounts[0], 'iban')
      expect(findAccount(rec, [withoutIban, ...accounts.slice(1)])).toEqual(
        withoutIban
      )
    })

    it('should not match account when not possible', () => {
      const account = findAccount(recipients[3], accounts)
      expect(account).toBe(null)
    })
  })

  it('should correctly group as beneficiary', () => {
    const beneficiaries = groupAsBeneficiary(recipients, accounts)
    expect(beneficiaries[0]).toMatchObject({
      category: 'internal',
      label: 'My account',
      iban: 'FR763000401390000003341337',
      account: accounts[0]
    })
  })

  it('should correctly filter', () => {
    const isExternal = createCategoryFilter('external', accounts)
    const isInternal = createCategoryFilter('internal', accounts)

    // // category is ok to discriminate
    // expect(isExternal(recipients[0])).toBe(false)
    // expect(isInternal(recipients[0])).toBe(true)

    // category is ok to discriminate
    expect(isExternal(recipients[3])).toBe(true)
    expect(isInternal(recipients[3])).toBe(false)

    // category is not sufficient, need to look at accounts
    expect(isExternal(recipients[4])).toBe(false)
    expect(isInternal(recipients[4])).toBe(true)
  })
})
