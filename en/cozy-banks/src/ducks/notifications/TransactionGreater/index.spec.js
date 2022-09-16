import CozyClient from 'cozy-client'
import TransactionGreater from './index'
import { prepareTransactionForTest } from './testUtils'
import fixtures from 'test/fixtures/unit-tests.json'
import fixturesTransactionGreater from 'test/fixtures/transaction-greater-fixtures.json'
import MockDate from 'mockdate'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/minBy'
import frLocale from 'locales/fr.json'
import { formatTransaction, MAX_CHAR_BY_LINE } from './utils'
import { setAlreadyNotified } from 'ducks/transactions/helpers'

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

  const setup = ({
    value,
    accountOrGroup,
    transactions: transactionsOpt
  } = {}) => {
    const cozyUrl = 'http://cozy.tools:8080'
    const client = new CozyClient({
      uri: cozyUrl,
      appMetadata: {
        slug: 'io.cozy.banks'
      }
    })
    const transactions = fixtures['io.cozy.bank.operations']
    const maxDate = transactions.map(x => x.date).sort()[0]
    MockDate.set(maxDate)

    const config = {
      lang: 'fr',
      locales: {
        fr: frLocale
      },
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
        transactions: (transactionsOpt || transactions).map(
          prepareTransactionForTest
        ),
        accounts: fixtures['io.cozy.bank.accounts'],
        groups: fixtures['io.cozy.bank.groups']
      },
      client,
      cozyUrl
    }
    const notification = new TransactionGreater(config)
    return { config, client, notification }
  }

  it('should keep rules in its internal state', () => {
    const { notification, config } = setup()
    expect(notification.rules).toBe(config.rules)
  })

  it('should compute the correct app route to open (multiple accounts)', async () => {
    const { notification } = setup()
    await notification.buildData()
    expect(notification.getExtraAttributes()).toMatchObject({
      data: {
        source: 'io.cozy.banks',
        route: '/balances/details'
      }
    })
  })

  it('should compute the correct app route to open (single account)', async () => {
    const { notification: notification2 } = setup({
      transactions: fixtures['io.cozy.bank.operations'].filter(
        t => t.account == 'compteisa1'
      )
    })
    await notification2.buildData()
    expect(notification2.getExtraAttributes()).toMatchObject({
      data: {
        route: '/balances/compteisa1/details',
        source: 'io.cozy.banks'
      }
    })
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
      _id: 'isabelle',
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

  describe('getPushContent', () => {
    describe('one transaction matching', () => {
      const operations = fixturesTransactionGreater['io.cozy.bank.operations']
      const maxDate = operations.map(x => x.date).sort()[0]
      MockDate.set(maxDate)

      it('should have the right content with edf (small label)', async () => {
        const op = operations.find(o => o._id === 'edf')
        const { notification } = setup({ transactions: [op] })

        const data = await notification.buildData()
        const title = notification.getTitle(data)
        const pushContent = notification.getPushContent(data)

        const expectPushContent = 'Edf Particuliers : 77,50€'

        expect(title).toBe('Versement de 77,50€')
        expect(pushContent.length).toBeLessThanOrEqual(MAX_CHAR_BY_LINE)
        expect(pushContent).toBe(expectPushContent)
      })

      it('should have the right content with long label', async () => {
        const op = operations.find(o => o._id === 'salaireseptembre')
        const { notification } = setup({ transactions: [op] })

        const data = await notification.buildData()
        const title = notification.getTitle(data)
        const pushContent = notification.getPushContent(data)

        const expectPushContent =
          'Salaire Du Mois De Septembre 2021 (01/0 : 1234,56€'

        expect(title).toBe('Versement de 1234,56€')
        expect(pushContent.length).toBe(MAX_CHAR_BY_LINE)
        expect(pushContent).toBe(expectPushContent)
      })
    })

    describe('multiple transactions matching', () => {
      const operations = fixturesTransactionGreater['io.cozy.bank.operations']

      it('should have the right content with 3 transactions', async () => {
        const ops = operations.filter(({ amount }) => amount > 1000)
        const { notification } = setup({
          transactions: ops,
          value: 1000
        })

        const data = await notification.buildData()
        const title = notification.getTitle(data)
        const pushContent = notification.getPushContent(data)

        const expectPushContent =
          'Salaire Du Mois De Septembre 2021 (01/0 : 1234,56€\nSalaire Du Mois De Octobre 2021 (01/10/ : 1234,56€\nSalaire Du Mois De Novembre 2021 (01/11 : 2000,12€'

        expect(title).toBe('3 mouvements de plus de 1000€')
        expect(pushContent).toBe(expectPushContent)
        expect(pushContent).toBe(expectPushContent)
      })

      it('should have the right content with 4 transactions', async () => {
        const ops = operations.filter(({ amount }) => amount > 900)
        const { notification } = setup({
          transactions: ops,
          value: 900
        })

        const data = await notification.buildData()
        const title = notification.getTitle(data)
        const pushContent = notification.getPushContent(data)

        const expectPushContent =
          'Salaire Du Mois De Septembre 2021 (01/0 : 1234,56€\nSalaire Du Mois De Octobre 2021 (01/10/ : 1234,56€\nSalaire Du Mois De Novembre 2021 (01/11 : 2000,12€...'

        expect(title).toBe('4 mouvements de plus de 900€')
        expect(pushContent).toBe(expectPushContent)
      })
    })

    describe('Format transaction', () => {
      const operations = fixturesTransactionGreater['io.cozy.bank.operations']
      const opEdf = operations.find(o => o._id === 'edf')
      const opSalaire = operations.find(o => o._id === 'salaireseptembre')

      const transactionEdf = formatTransaction(opEdf, false)
      expect(transactionEdf.length).toBeLessThanOrEqual(MAX_CHAR_BY_LINE)
      expect(transactionEdf).toEqual('Edf Particuliers : 77,50€')

      const transactionSalaire = formatTransaction(opSalaire, false)
      expect(transactionSalaire.length).toBe(MAX_CHAR_BY_LINE)
      expect(transactionSalaire).toEqual(
        'Salaire Du Mois De Septembre 2021 (01/0 : 1234,56€'
      )
    })
  })

  describe('buildData', () => {
    const operations = fixturesTransactionGreater['io.cozy.bank.operations']

    it('should filter out transactions which have already been notified', async () => {
      const transactions = operations
        .filter(({ amount }) => amount > 1000)
        .map((op, i) => {
          return i % 2 === 0 ? setAlreadyNotified(op, TransactionGreater) : op
        })
      const { notification } = setup({ transactions, value: 1000 })

      const data = await notification.buildData()
      expect(data.transactions).toHaveLength(1)
    })
  })
})
