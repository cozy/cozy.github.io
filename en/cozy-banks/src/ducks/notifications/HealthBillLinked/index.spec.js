import CozyClient from 'cozy-client'
import { Document } from 'cozy-doctypes'
import { sendNotification } from 'cozy-notifications'

import HealthBillLinked from './index'
import { Bill } from 'src/models'
import { setAlreadyNotified } from 'ducks/transactions/helpers'
import billsFixtures from 'test/fixtures/matching-service/bill-reimbursement.json'

const mockAccounts = [{ _id: 'accountId3' }]
const mockBills = billsFixtures['io.cozy.bills']
const mockTransactions = [
  {
    _id: 't1',
    amount: -mockBills[0].amount,
    date: '2018-09-18T12:00',
    label: '3',
    manualCategoryId: '400610',
    account: 'accountId3',
    reimbursements: [{ billId: `io.cozy.bills:${mockBills[0]._id}` }]
  }
]

describe('HealthBillLinked', () => {
  const setup = ({ client, lang, data }) => {
    const localeStrings = require(`locales/${lang}.json`)
    const {
      initTranslation
    } = require('cozy-ui/transpiled/react/providers/I18n/translation')
    const translation = initTranslation(lang, () => localeStrings)
    const t = translation.t.bind(translation)
    const notification = new HealthBillLinked({
      t,
      data,
      lang: 'en',
      locales: {
        en: localeStrings
      },
      client: client || { stackClient: { uri: 'http://cozy.tools:8080' } },
      value: 20
    })
    return { notification }
  }

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(msg => {
      throw new Error(`Warning during tests ${msg}`)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('buildData', () => {
    it('should fetch transactions with a linked bill', async () => {
      jest.spyOn(Bill, 'getAll').mockResolvedValue(mockBills)

      const { notification } = setup({
        lang: 'en',
        data: { transactions: mockTransactions }
      })
      const data = await notification.buildData()
      expect(data.transactions).toHaveLength(1)
    })

    it('should not fetch transactions already notified', async () => {
      jest.spyOn(Bill, 'getAll').mockResolvedValue(mockBills)

      const { notification } = setup({
        lang: 'en',
        data: {
          transactions: mockTransactions.map(translation =>
            setAlreadyNotified({ ...translation }, HealthBillLinked)
          )
        }
      })
      const data = await notification.buildData()
      expect(data).toBeUndefined()
    })
  })

  describe('onSuccess', () => {
    it('should be called after successfully sending notifications', async () => {
      jest.spyOn(Bill, 'getAll').mockResolvedValue(mockBills)

      const client = new CozyClient({
        uri: 'http://localhost:8080'
      })
      Document.registerClient(client)
      jest.spyOn(client, 'saveAll').mockImplementation()
      jest.spyOn(client.stackClient, 'fetchJSON').mockResolvedValue({})

      const { notification } = setup({
        client,
        lang: 'en',
        data: { transactions: mockTransactions, accounts: mockAccounts }
      })
      jest.spyOn(notification, 'onSuccess')

      await sendNotification(client, notification)
      expect(notification.onSuccess).toHaveBeenCalled()
      expect(client.saveAll).toHaveBeenCalledWith(
        mockTransactions.map(transaction =>
          setAlreadyNotified(transaction, HealthBillLinked)
        )
      )
    })
  })
})
