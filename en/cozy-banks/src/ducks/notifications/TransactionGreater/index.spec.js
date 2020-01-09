import CozyClient from 'cozy-client'
import TransactionGreater from './index'
import fixtures from 'test/fixtures/unit-tests.json'
import MockDate from 'mockdate'
import compose from 'lodash/flowRight'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/minBy'

const addRev = doc => {
  return { ...doc, _rev: '1-deadbeef' }
}

const addId = doc => {
  return { ...doc, _id: doc._id || Math.random().toString() }
}

const prepareTransactionForTest = compose(
  addRev,
  addId
)

const unique = arr => Array.from(new Set(arr))

const minValueBy = (arr, fn) => fn(minBy(arr, fn))
const maxValueBy = (arr, fn) => fn(maxBy(arr, fn))
const getTransactionAbsAmount = tr => Math.abs(tr.amount)
const getAccountIDFromTransaction = transaction => transaction.account

describe('transaction greater', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(msg => {
      throw new Error(`Warning during tests ${msg}`)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const setup = ({ value, accountOrGroup } = {}) => {
    const cozyUrl = 'http://cozy.tools:8080'
    const client = new CozyClient({
      uri: cozyUrl
    })
    const locales = {}

    const operations = fixtures['io.cozy.bank.operations']
    const maxDate = operations.map(x => x.date).sort()[0]
    MockDate.set(maxDate)

    const config = {
      rules: [
        {
          value: value || 10,
          accountOrGroup: accountOrGroup || null,
          enabled: true
        },
        {
          value: value || 10,
          accountOrGroup: accountOrGroup || null,
          enabled: false
        }
      ],
      data: {
        transactions: operations.map(prepareTransactionForTest),
        accounts: fixtures['io.cozy.bank.accounts'],
        groups: fixtures['io.cozy.bank.groups']
      },
      client,
      locales,
      cozyUrl
    }
    const notification = new TransactionGreater(config)
    return { config, client, notification }
  }

  it('should keep rules in its internal state', () => {
    const { notification, config } = setup()
    expect(notification.rules).toBe(config.rules)
  })

  describe('without accountOrGroup', () => {
    it('should compute relevant transactions', async () => {
      const { notification } = setup()
      const { transactions } = await notification.buildData()
      expect(transactions).toHaveLength(116)
    })
    it('should compute relevant transactions for a different value', async () => {
      const { notification } = setup({ value: 100 })
      const { transactions } = await notification.buildData()
      expect(transactions).toHaveLength(22)
      expect(unique(transactions.map(getAccountIDFromTransaction))).toEqual([
        'compteisa1',
        'compteisa3',
        'comptegene1'
      ])
    })
  })

  describe('with account', () => {
    const compteisa1 = {
      _id: 'compteisa1',
      _type: ACCOUNT_DOCTYPE
    }

    it('should compute relevant transactions', async () => {
      const { notification } = setup({
        accountOrGroup: compteisa1
      })
      const data = await notification.buildData()
      expect(data.transactions).toHaveLength(63)
      expect(
        unique(data.transactions.map(getAccountIDFromTransaction))
      ).toEqual(['compteisa1'])
    })

    it('should compute relevant transactions for a different value', async () => {
      const { notification } = setup({
        value: 100,
        accountOrGroup: compteisa1
      })
      const data = await notification.buildData()
      expect(data.transactions).toHaveLength(16)
      expect(
        unique(data.transactions.map(getAccountIDFromTransaction))
      ).toEqual(['compteisa1'])
    })
  })

  describe('with group', () => {
    const isabelleGroup = {
      _id: 'b3e33d6cc334ed5ef49738a2be2880a2',
      _type: GROUP_DOCTYPE
    }

    it('should compute relevant transactions', async () => {
      const { notification } = setup({
        accountOrGroup: isabelleGroup
      })
      const { transactions } = await notification.buildData()
      expect(transactions).toHaveLength(76)
      expect(unique(transactions.map(getAccountIDFromTransaction))).toEqual([
        'compteisa1',
        'compteisa3',
        'comptelou1'
      ])
      expect(minValueBy(transactions, getTransactionAbsAmount)).toBeGreaterThan(
        10
      )
      expect(maxValueBy(transactions, getTransactionAbsAmount)).toBe(3870.54)
    })

    it('should compute relevant transactions for a different value', async () => {
      const { notification } = setup({
        value: 100,
        accountOrGroup: isabelleGroup
      })
      const { transactions } = await notification.buildData()
      expect(transactions).toHaveLength(19)
      expect(unique(transactions.map(getAccountIDFromTransaction))).toEqual([
        'compteisa1',
        'compteisa3'
      ])
      expect(minValueBy(transactions, getTransactionAbsAmount)).toBeGreaterThan(
        100
      )
      expect(maxValueBy(transactions, getTransactionAbsAmount)).toBe(3870.54)
    })
  })
})
