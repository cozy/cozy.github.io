import DelayedDebit, { isCreditCardAccount, isWithinEndOfMonthRange } from '.'
import MockDate from 'mockdate'
import { ACCOUNT_DOCTYPE } from 'doctypes'
import { BankAccount } from 'cozy-doctypes'

const accounts = [
  { _id: 'checkings1', type: 'Checkings', balance: 100 },
  { _id: 'checkings2', type: 'Checkings', balance: 100 },
  { _id: '¯\\_(ツ)_/¯', type: 'Other', balance: 100 },
  {
    _id: 'creditcard1',
    type: 'CreditCard',
    comingBalance: -200
  },
  {
    _id: 'creditcard2',
    type: 'CreditCard',
    comingBalance: 0
  }
]

describe('DelayedDebit::isWithinEndOfMonthRange', () => {
  afterEach(() => {
    MockDate.reset()
  })

  it('should return false when the date is not ok', () => {
    MockDate.set(new Date(2019, 5, 24))

    expect(isWithinEndOfMonthRange(2)).toBe(false)
  })

  it('should return true when the date is ok', () => {
    MockDate.set(new Date(2019, 5, 28))
    expect(isWithinEndOfMonthRange(2)).toBe(true)

    MockDate.set(new Date(2019, 5, 29))
    expect(isWithinEndOfMonthRange(2)).toBe(true)

    MockDate.set(new Date(2019, 5, 30))
    expect(isWithinEndOfMonthRange(2)).toBe(true)
  })
})

describe('DelayedDebit::isCreditCardAccount', () => {
  it('should return the credit card accounts with associated checkings account', () => {
    expect(accounts.filter(isCreditCardAccount).map(x => x._id)).toEqual([
      'creditcard1',
      'creditcard2'
    ])
  })
})

describe('DelayedDebit', () => {
  let notification

  beforeEach(() => {
    notification = new DelayedDebit({
      lang: 'en',
      locales: {},
      t: () => {},
      client: {
        stackClient: {
          uri: 'http://cozy.tools:8080'
        }
      },
      rules: [
        {
          enabled: true,
          value: 2,
          checkingsAccount: {
            _type: ACCOUNT_DOCTYPE,
            _id: 'checkings1'
          },
          creditCardAccount: {
            _type: ACCOUNT_DOCTYPE,
            _id: 'creditcard1'
          }
        },
        {
          enabled: true,
          value: 2,
          checkingsAccount: {
            _type: ACCOUNT_DOCTYPE,
            _id: 'checkings2'
          },
          creditCardAccount: {
            _type: ACCOUNT_DOCTYPE,
            _id: 'creditcard2'
          }
        }
      ],
      data: {}
    })
  })

  describe('findMatchingRules', () => {
    beforeEach(() => {
      MockDate.set(new Date(2019, 5, 29))
      jest.spyOn(BankAccount, 'fetchAll').mockReturnValue(accounts)
    })
    afterEach(() => {
      BankAccount.fetchAll.mockRestore()
    })

    it('should return the right rules', async () => {
      expect(await notification.findMatchingRules()).toMatchObject([
        {
          checkingsAccount: {
            _id: 'checkings1',
            balance: 100,
            type: 'Checkings'
          },
          creditCardAccount: {
            _id: 'creditcard1',
            comingBalance: -200,
            type: 'CreditCard'
          },
          rule: {
            checkingsAccount: {
              _id: 'checkings1',
              _type: 'io.cozy.bank.accounts'
            },
            creditCardAccount: {
              _id: 'creditcard1',
              _type: 'io.cozy.bank.accounts'
            },
            enabled: true,
            value: 2
          }
        }
      ])
    })
  })
})
