import CozyClient from 'cozy-client'
import BalanceLower from './index'
import fixtures from 'test/fixtures/unit-tests.json'
import MockDate from 'mockdate'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/minBy'
import enLocale from 'locales/en.json'

import { fetchSettings } from 'ducks/settings/helpers'

const unique = arr => Array.from(new Set(arr))

const minValueBy = (arr, fn) => fn(minBy(arr, fn))
const maxValueBy = (arr, fn) => fn(maxBy(arr, fn))
const getIDFromAccount = account => account._id
const getAccountBalance = account => account.balance

jest.mock('../../settings/helpers', () => ({
  ...jest.requireActual('../../settings/helpers'),
  fetchSettings: jest.fn()
}))

describe('balance lower', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(msg => {
      throw new Error(`Warning during tests ${msg}`)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const setup = ({
    ruleValue,
    accountOrGroup,
    rules,
    balancesNotifications = {}
  } = {}) => {
    const cozyUrl = 'http://cozy.tools:8080'
    const client = new CozyClient({
      uri: cozyUrl
    })
    client.query = jest.fn()
    fetchSettings.mockResolvedValue({ balancesNotifications })

    const locales = {
      en: enLocale
    }

    const operations = fixtures['io.cozy.bank.operations']
    const maxDate = operations.map(x => x.date).sort()[0]
    MockDate.set(maxDate)

    const config = {
      rules: rules || [
        {
          value: ruleValue || 5000,
          accountOrGroup: accountOrGroup || null,
          enabled: true
        }
      ],
      data: {
        accounts: fixtures['io.cozy.bank.accounts'],
        groups: fixtures['io.cozy.bank.groups']
      },
      client,
      locales,
      lang: 'en',
      cozyUrl
    }
    const notification = new BalanceLower(config)
    return { config, client, notification }
  }

  it('should keep rules in its internal state', () => {
    const { notification, config } = setup()
    expect(notification.rules).toBe(config.rules)
  })

  describe('without accountOrGroup', () => {
    it('should compute relevant accounts', async () => {
      const { notification } = setup({ ruleValue: 5000 })
      const { accounts } = await notification.buildData()
      expect(accounts).toHaveLength(4)
      expect(maxValueBy(accounts, getAccountBalance)).toBeLessThan(5000)
    })

    it('should return only accounts where their previous balances were not already positive to the rule', async () => {
      // Original balances: "compteisa4": 1421.20, "compteisa1": 3974.20
      const { notification } = setup({
        ruleValue: 5000,
        balancesNotifications: { compteisa4: 2000, compteisa1: 5000 }
      })
      const { accounts } = await notification.buildData()

      expect(accounts).toHaveLength(3)
      expect(maxValueBy(accounts, getAccountBalance)).toBeLessThan(5000)
    })

    it('should not return accounts if previous balances were already positive to the rule', async () => {
      // Original balances: "compteisa4": 1421.20, "compteisa1": 3974.20
      const { notification } = setup({
        ruleValue: 5000,
        balancesNotifications: {
          compteisa4: 100,
          compteisa1: 4999
        }
      })
      const { accounts } = await notification.buildData()

      expect(accounts).toHaveLength(2)
      expect(maxValueBy(accounts, getAccountBalance)).toBeLessThan(5000)
    })

    it('should compute relevant accounts for a different value', async () => {
      const { notification } = setup({ ruleValue: 3000 })
      const { accounts } = await notification.buildData()
      expect(accounts).toHaveLength(2)
      expect(maxValueBy(accounts, getAccountBalance)).toBeLessThan(3000)
      expect(unique(accounts.map(getIDFromAccount))).toEqual([
        'compteisa4',
        'comptelou1'
      ])
    })
  })

  describe('with account', () => {
    const compteisa1 = {
      _id: 'compteisa1',
      _type: ACCOUNT_DOCTYPE
    }

    it('should compute relevant accounts', async () => {
      const { notification } = setup({
        accountOrGroup: compteisa1
      })
      const { accounts } = await notification.buildData()
      expect(accounts).toHaveLength(1)
      expect(unique(accounts.map(getIDFromAccount))).toEqual(['compteisa1'])
    })

    it('should compute relevant accounts for a different value', async () => {
      const { notification } = setup({
        ruleValue: 3000,
        accountOrGroup: compteisa1
      })
      const data = await notification.buildData()
      expect(data).toBeUndefined()
    })
  })

  describe('with group', () => {
    const isabelleGroup = {
      _id: 'isabelle',
      _type: GROUP_DOCTYPE
    }

    it('should compute relevant accounts', async () => {
      const { notification } = setup({
        accountOrGroup: isabelleGroup,
        ruleValue: 5000
      })
      const { accounts } = await notification.buildData()
      expect(accounts).toHaveLength(2)
      expect(unique(accounts.map(getIDFromAccount))).toEqual([
        'compteisa1',
        'comptelou1'
      ])
      expect(minValueBy(accounts, getAccountBalance)).toBeLessThan(5000)
      expect(maxValueBy(accounts, getAccountBalance)).toBe(3974.2)
    })

    it('should compute relevant accounts for a different value', async () => {
      const { notification } = setup({
        ruleValue: 500,
        accountOrGroup: isabelleGroup
      })
      const { accounts } = await notification.buildData()
      expect(accounts).toHaveLength(1)
      expect(unique(accounts.map(getIDFromAccount))).toEqual(['comptelou1'])
      expect(minValueBy(accounts, getAccountBalance)).toBeLessThan(500)
      expect(maxValueBy(accounts, getAccountBalance)).toBe(325.24)
    })
  })

  describe('notification content', () => {
    const setupContent = async ({ rules }) => {
      const { notification } = setup({
        rules
      })
      const data = await notification.buildData()
      const title = notification.getTitle(data)
      const pushContent = notification.getPushContent(data)
      return { title, pushContent }
    }

    const lou1Rule = {
      value: 500,
      enabled: true,
      accountOrGroup: { _type: ACCOUNT_DOCTYPE, _id: 'comptelou1' }
    }

    const allAccountsRule = {
      value: 5000,
      enabled: true
    }

    describe('one account matching', () => {
      it('should have the right content', async () => {
        const { title, pushContent } = await setupContent({
          rules: [lou1Rule, { ...allAccountsRule, enabled: false }]
        })
        expect(title).toBe(
          "Balance alert: 'Compte jeune Louise' account is at 325,24€"
        )
        expect(pushContent).toBe('Compte jeune Louise +325,24€')
      })
    })

    describe('mutiple accounts matching', () => {
      it('should have the right content', async () => {
        const { title, pushContent } = await setupContent({
          rules: [allAccountsRule]
        })
        expect(title).toBe(
          '4 accounts are below your threshold amount of 5000€'
        )
        expect(pushContent).toBe(
          'PEE Isabelle +1421,20€\nCompte courant Claude +4135,62€\nCompte courant Isabelle +3974,20€\nCompte jeune Louise +325,24€'
        )
      })
    })

    describe('mutiple accounts matching', () => {
      it('should have the right content', async () => {
        const { title, pushContent } = await setupContent({
          rules: [lou1Rule, allAccountsRule]
        })
        expect(title).toBe('4 accounts are below their threshold amount')
        expect(pushContent).toBe(
          'Compte jeune Louise +325,24€\nPEE Isabelle +1421,20€\nCompte courant Claude +4135,62€\nCompte courant Isabelle +3974,20€'
        )
      })
    })
  })
})
