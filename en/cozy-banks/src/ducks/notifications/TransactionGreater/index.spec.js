import CozyClient from 'cozy-client'
import TransactionGreater from './index'
import { prepareTransactionForTest } from './testUtils'
import fixtures from 'test/fixtures/unit-tests.json'
import MockDate from 'mockdate'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/minBy'
import frLocale from 'locales/fr.json'

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
    expect(notification.getExtraAttributes()).toEqual({
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
    expect(notification2.getExtraAttributes()).toEqual({
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
    it('should have the right content with one transaction', async () => {
      const { notification } = setup({
        transactions: [
          fixtures['io.cozy.bank.operations'].filter(t => t.amount > 10)[0]
        ]
      })
      const data = await notification.buildData()
      const title = notification.getTitle(data)
      const pushContent = notification.getPushContent(data)

      expect(title).toBe('Versement de 3870.54€')
      expect(pushContent).toBe('SALAIRE : 3870.54€')
    })

    it('should have the right content with multiple transactions', async () => {
      const { notification } = setup()
      const data = await notification.buildData()
      const title = notification.getTitle(data)
      const pushContent = notification.getPushContent(data)

      expect(title).toBe('116 mouvements de plus de 10€')
      expect(pushContent).toBe(
        'Compte courant Isabelle: 63 mouvements\nLivret A Isabelle: 3 mouvements\nCompte jeune Louise: 10 mouvements\nCompte courant Claude: 9 mouvements\nCompte courant Genevieve: 31 mouvements'
      )
    })
  })
})
