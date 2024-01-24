import CozyClient from 'cozy-client'
import { Document } from 'cozy-doctypes'
import { sendNotification } from 'cozy-notifications'

import LateHealthReimbursement from './index'
import { Transaction, Bill, BankAccount } from 'src/models'
import { setAlreadyNotified } from 'ducks/transactions/helpers'

import fetch from 'node-fetch'
window.fetch = fetch

const mockTransactions = [
  // This transaction is not taken into account since it is not an expense
  {
    _id: 't1',
    amount: 20,
    date: '2018-09-16T12:00',
    manualCategoryId: '400610',
    label: '1',
    account: 'accountId1'
  },

  // This transaction is not taken into account since it is not a health transaction
  {
    _id: 't2',
    amount: 10,
    date: '2018-09-17T12:00',
    label: '2',
    account: 'accountId2'
  },
  {
    _id: 't3',
    amount: -5,
    date: '2018-09-18T12:00',
    label: '3',
    manualCategoryId: '400610',
    account: 'accountId3',

    // Should not be taken into account since with at least 1 bill, it is
    // considered reimbursed
    reimbursements: [{ billId: 'io.cozy.bills:billId12345' }]
  },
  {
    _id: 't4',
    amount: -15,
    // will never be late since the date is now
    date: new Date().toISOString(),
    label: '3',
    manualCategoryId: '400610',
    account: 'accountId5',
    reimbursements: [{ billId: 'io.cozy.bills:billId12345' }]
  },
  // This transaction is not taken into account since we already sent a notification
  setAlreadyNotified(
    {
      _id: 't5',
      amount: -30,
      date: '2018-09-07T12:00',
      manualCategoryId: '400610',
      label: '1',
      account: 'accountId1'
    },
    LateHealthReimbursement
  ),

  {
    _id: 't6',
    amount: -20,
    date: '2018-09-16T12:00',
    manualCategoryId: '400610',
    label: '1',
    account: 'accountId1'
  }
]

beforeEach(() => {
  jest.spyOn(Document, 'queryAll').mockResolvedValue([])
  jest.spyOn(Document, 'getAll').mockResolvedValue([])
})

describe('LateHealthReimbursement', () => {
  const setup = ({ client, lang }) => {
    const localeStrings = require(`locales/${lang}.json`)
    const {
      initTranslation
    } = require('cozy-ui/transpiled/react/providers/I18n/translation')
    const translation = initTranslation(lang, () => localeStrings)
    const t = translation.t.bind(translation)
    const notification = new LateHealthReimbursement({
      t,
      data: {},
      lang: 'en',
      locales: {
        en: localeStrings
      },
      client: client || { stackClient: { uri: 'http://cozy.tools:8080' } },
      value: 20
    })
    return { notification }
  }
  ;['fr', 'en'].forEach(lang => {
    it(`should return push content for lang ${lang}`, () => {
      const { notification } = setup({ lang })
      const oneTransaction = new Array(1)
      const twoTransactions = new Array(2)

      expect(
        notification.getPushContent({ transactions: oneTransaction })
      ).toMatchSnapshot()
      expect(
        notification.getPushContent({ transactions: twoTransactions })
      ).toMatchSnapshot()
    })
  })

  it('should fetch data', async () => {
    jest.spyOn(Transaction, 'queryAll').mockResolvedValue(mockTransactions)
    jest.spyOn(Document, 'getAll').mockImplementation(async function () {
      if (this.doctype == 'io.cozy.bills') {
        return [{ _id: 'billId12345' }]
      } else if (this.doctype == 'io.cozy.bank.accounts') {
        return [{ _id: 'accountId3' }]
      }
    })
    const { notification } = setup({ lang: 'en' })

    const res = await notification.fetchData()
    jest.spyOn(notification, 'onSuccess')

    expect(Bill.getAll).toHaveBeenCalledWith(['billId12345'])
    expect(BankAccount.getAll).toHaveBeenCalledWith(['accountId1'])
    expect(res.transactions).toHaveLength(1)
    expect(res.transactions[0]).toMatchObject({
      account: 'accountId1'
    })
    expect(res.accounts).toHaveLength(1)
  })

  it('should be called with onSuccess', async () => {
    jest.spyOn(Transaction, 'queryAll').mockResolvedValue(mockTransactions)
    jest.spyOn(Document, 'getAll').mockImplementation(async function () {
      if (this.doctype == 'io.cozy.bills') {
        return [{ _id: 'billId12345' }]
      } else if (this.doctype == 'io.cozy.bank.accounts') {
        return [{ _id: 'accountId3' }, { _id: 'accountId1' }]
      }
    })

    const client = new CozyClient({
      uri: 'http://localhost:8080'
    })
    Document.registerClient(client)
    jest.spyOn(client, 'saveAll').mockImplementation()

    const { notification } = setup({ client, lang: 'en' })
    jest.spyOn(notification, 'onSuccess')
    jest.spyOn(client.stackClient, 'fetchJSON').mockResolvedValue({})

    await sendNotification(client, notification)

    expect(notification.onSuccess).toHaveBeenCalled()
    expect(client.saveAll).toHaveBeenCalledWith([
      setAlreadyNotified(
        mockTransactions[mockTransactions.length - 1],
        LateHealthReimbursement
      )
    ])
  })
})
