import DelayedDebit from './DelayedDebit'
import keyBy from 'lodash/keyBy'
import MockDate from 'mockdate'

describe('DelayedDebit', () => {
  let notification
  let creditCards
  let hydratedCreditCards
  let accounts

  beforeEach(() => {
    notification = new DelayedDebit({
      cozyClient: { _url: 'http://cozy.tools:8080' },
      value: 2
    })

    accounts = [
      { _id: 'checkings1', type: 'Checkings', balance: 100 },
      { _id: 'checkings2', type: 'Checkings', balance: 100 },
      { _id: '¯\\_(ツ)_/¯', type: 'Other', balance: 100 },
      {
        _id: 'creditcard1',
        type: 'CreditCard',
        comingBalance: -200,
        relationships: {
          checkingsAccount: {
            data: {
              _id: 'checkings1'
            }
          }
        }
      },
      {
        _id: 'creditcard2',
        type: 'CreditCard',
        comingBalance: 0,
        relationships: {
          checkingsAccount: {
            data: {
              _id: 'checkings2'
            }
          }
        }
      }
    ]

    const accountsById = keyBy(accounts, a => a._id)

    creditCards = accounts.filter(account => account.type === 'CreditCard')

    hydratedCreditCards = creditCards.map(creditCard => ({
      ...creditCard,
      checkingsAccount: {
        data: accountsById[creditCard.relationships.checkingsAccount.data._id]
      }
    }))
  })

  describe('checkDate', () => {
    afterEach(() => {
      MockDate.reset()
    })

    it('should return false when the date is not ok', () => {
      MockDate.set(new Date(2019, 5, 24))

      expect(notification.checkDate()).toBe(false)
    })

    it('should return true when the date is ok', () => {
      MockDate.set(new Date(2019, 5, 28))
      expect(notification.checkDate()).toBe(true)

      MockDate.set(new Date(2019, 5, 29))
      expect(notification.checkDate()).toBe(true)

      MockDate.set(new Date(2019, 5, 30))
      expect(notification.checkDate()).toBe(true)
    })
  })

  describe('filterCreditCardAccounts', () => {
    it('should return the credit card accounts with associated checkings account', () => {
      expect(notification.filterCreditCardAccounts(accounts)).toEqual(
        creditCards
      )
    })
  })

  describe('linkCreditCardsToCheckings', () => {
    it('should resolve relationships between accounts', () => {
      notification.linkCreditCardsToCheckings(creditCards, accounts)

      expect(creditCards).toEqual(hydratedCreditCards)
    })
  })

  describe('shouldBeNotified', () => {
    it('should return true if the credit card account should be notified', () => {
      expect(notification.shouldBeNotified(hydratedCreditCards[0])).toBe(true)
    })

    it('should return false if the credit card account should not be notified', () => {
      expect(notification.shouldBeNotified(hydratedCreditCards[1])).toBe(false)
    })
  })
})
