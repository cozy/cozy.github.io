import {
  getDate,
  getReimbursedAmount,
  isFullyReimbursed,
  isExpense,
  getReimbursementStatus,
  isReimbursementLate,
  hasReimbursements,
  hasBills,
  isAlreadyNotified,
  updateApplicationDate,
  updateTransactionRecurrence,
  getApplicationDate,
  REIMBURSEMENTS_STATUS,
  computeTransactionsByDateAndApplicationDate
} from './helpers'
import {
  RECURRENCE_DOCTYPE,
  BILLS_DOCTYPE,
  TRANSACTION_DOCTYPE,
  schema
} from 'doctypes'
import MockDate from 'mockdate'
import CozyClient, { createMockClient } from 'cozy-client'
import logger from 'cozy-client/dist/logger'

import { getCategoryIdFromName } from 'ducks/categories/helpers'

// eslint-disable-next-line no-console
console.warn = jest.fn()
jest.spyOn(logger, 'warn').mockImplementation(() => {})

describe('reimbursements', () => {
  let client
  const healthId = '400610'
  const BILL_ID = '1234'
  const bills = [
    {
      _type: BILLS_DOCTYPE,
      _id: `${BILL_ID}`
    }
  ]
  const transactions = [
    {
      _type: TRANSACTION_DOCTYPE,
      automaticCategoryId: healthId,
      amount: -10,
      reimbursements: [{ billId: `${BILLS_DOCTYPE}:${BILL_ID}` }]
    }
  ]
  const transaction = transactions[0]

  const getFirstReimbursementBill = transaction =>
    transaction.reimbursements.data[0].bill

  beforeEach(() => {
    client = createMockClient({
      queries: {
        bills: {
          doctype: BILLS_DOCTYPE,
          data: bills
        },
        transactions: {
          doctype: TRANSACTION_DOCTYPE,
          data: transactions
        }
      },
      clientOptions: {
        schema
      }
    })
  })

  it('should be hydrated if transaction in health category', () => {
    const transactions = [transaction].map(transaction =>
      client.hydrateDocument(transaction)
    )
    expect(getFirstReimbursementBill(transactions[0])).toBeTruthy()
    expect(getFirstReimbursementBill(transactions[0])._id).toBe(BILL_ID)
  })

  it('should not be hydrated if bill does not exist in store', () => {
    const transactions = [
      { ...transaction, reimbursements: [{ billId: undefined }] }
    ].map(transaction => client.hydrateDocument(transaction))
    expect(getFirstReimbursementBill(transactions[0])).toBe(undefined)
  })
})

describe('getDate', () => {
  it('should return realisation date if there is one and the linked account is a CreditCard one', () => {
    const transactionCreditCard = {
      realisationDate: '2019-01-28T00:00:00Z',
      date: '2019-01-31T00:00:00Z',
      account: { data: { type: 'CreditCard' } }
    }

    const transactionOther = {
      realisationDate: '2019-01-28T00:00:00Z',
      date: '2019-01-31T00:00:00Z'
    }

    expect(getDate(transactionCreditCard)).toBe('2019-01-28')
    expect(getDate(transactionOther)).toBe('2019-01-31')
  })

  it('should return the date if there is no relation date', () => {
    const transaction = { date: '2019-01-31T00:00:00Z' }

    expect(getDate(transaction)).toBe('2019-01-31')
  })
})

describe('getReimbursedAmount', () => {
  it('should throw if the given transaction is not an expense', () => {
    expect(() => getReimbursedAmount({ amount: 10 })).toThrow()
  })

  it('should return the good reimbursed amount', () => {
    const reimbursedExpense = {
      amount: -10,
      reimbursements: {
        data: [{ amount: 2 }, { amount: 8 }]
      }
    }

    expect(getReimbursedAmount(reimbursedExpense)).toBe(10)
  })
})

describe('isFullyReimbursed', () => {
  it('should return true if the expense is fully reimbursed, false otherwise', () => {
    const reimbursedExpense = {
      amount: -10,
      reimbursements: {
        data: [{ amount: 2 }, { amount: 8 }]
      }
    }

    const expense = { amount: -10 }

    expect(isFullyReimbursed(reimbursedExpense)).toBe(true)
    expect(isFullyReimbursed(expense)).toBe(false)
  })
})

describe('isExpense', () => {
  it('should return true if the transaction amount is lesser than 0', () => {
    const transaction = { amount: -10 }
    expect(isExpense(transaction)).toBe(true)
  })

  it('should return false if the transaction amount is greater than or equals to 0', () => {
    const t1 = { amount: 10 }
    expect(isExpense(t1)).toBe(false)

    const t2 = { amount: 0 }
    expect(isExpense(t2)).toBe(false)
  })
})

describe('getReimbursementStatus', () => {
  describe('General case', () => {
    it("should return the reimbursement status if it's defined", () => {
      const transaction = { reimbursementStatus: 'reimbursed' }
      expect(getReimbursementStatus(transaction)).toBe('reimbursed')
    })

    it("should return no-reimbursement status if it's undefined", () => {
      const transaction = {}
      expect(getReimbursementStatus(transaction)).toBe('no-reimbursement')
    })
  })

  describe('Health expense case', () => {
    it('should return `pending` if the status is undefined and the transaction no reimbursement', () => {
      const t1 = {
        manualCategoryId: '400610',
        amount: -10
      }

      const t2 = {
        manualCategoryId: '400610',
        amount: -10,
        reimbursements: {
          data: []
        }
      }

      expect(getReimbursementStatus(t1)).toBe(REIMBURSEMENTS_STATUS.pending)
      expect(getReimbursementStatus(t2)).toBe(REIMBURSEMENTS_STATUS.pending)
    })

    it('should return `reimbursed` if the status is undefined and the transaction has at least 1 reimbursement', () => {
      const t2 = {
        manualCategoryId: '400610',
        amount: -10,
        reimbursements: {
          data: [{ amount: 5 }]
        }
      }

      expect(getReimbursementStatus(t2)).toBe(REIMBURSEMENTS_STATUS.reimbursed)
    })

    it('should return `reimbursed` if the status is undefined and the transaction is fully reimbursed', () => {
      const transaction = {
        manualCategoryId: '400610',
        amount: -10,
        reimbursements: {
          data: [{ amount: 10 }]
        }
      }

      expect(getReimbursementStatus(transaction)).toBe(
        REIMBURSEMENTS_STATUS.reimbursed
      )
    })
  })

  describe('when the transaction is a professional expense', () => {
    const professionalExpensesCategoryId = getCategoryIdFromName(
      'professionalExpenses'
    )

    describe('when the transaction has a reimbursementStatus', () => {
      it('should return the reimbursementStatus', () => {
        const transaction = {
          manualCategoryId: professionalExpensesCategoryId,
          amount: -10,
          reimbursementStatus: REIMBURSEMENTS_STATUS.reimbursed
        }

        expect(getReimbursementStatus(transaction)).toBe(
          REIMBURSEMENTS_STATUS.reimbursed
        )
      })
    })

    describe('when the transaction does not have a reimbursementStatus', () => {
      it('should return pending', () => {
        const transaction = {
          manualCategoryId: professionalExpensesCategoryId,
          amount: -10
        }

        expect(getReimbursementStatus(transaction)).toBe(
          REIMBURSEMENTS_STATUS.pending
        )
      })
    })
  })
})

describe('isReimbursementLate', () => {
  afterEach(() => {
    MockDate.reset()
  })
  it('should return false if the transaction is not an health expense', () => {
    const transaction = {
      manualCategoryId: '400310',
      amount: 10
    }

    expect(isReimbursementLate(transaction, 30)).toBe(false)
  })

  it('should return false if the transaction reimbursement status is not pending', () => {
    const t1 = {
      reimbursementStatus: 'reimbursed',
      manualCategoryId: '400610',
      amount: -10
    }
    const t2 = {
      reimbursementStatus: 'no-reimbursement',
      manualCategoryId: '400610',
      amount: -10
    }

    expect(isReimbursementLate(t1, 30)).toBe(false)
    expect(isReimbursementLate(t2, 30)).toBe(false)
  })

  it('should return false if the transaction reimbursement is pending but for less than one month', () => {
    MockDate.set('06/03/2019')

    const transaction = {
      reimbursementStatus: 'pending',
      date: '2019-05-23',
      manualCategoryId: '400610',
      amount: -10
    }

    expect(isReimbursementLate(transaction, 30)).toBe(false)
  })

  it('should return true if the transaction reimbursement is pending for more than one month', () => {
    MockDate.set(new Date(2019, 4, 24))

    const transaction = {
      reimbursementStatus: 'pending',
      date: '2019-04-23',
      manualCategoryId: '400610',
      amount: -10
    }

    expect(isReimbursementLate(transaction, 30)).toBe(true)
  })
})

describe('hasReimbursements', () => {
  it('should return true if the transaction has reimbursements', () => {
    const transaction = {
      reimbursements: {
        data: [{ amount: 10 }]
      }
    }

    expect(hasReimbursements(transaction)).toBe(true)
  })

  it('should return false if the transaction does not have reimbursements', () => {
    const t1 = {
      reimbursements: {
        data: []
      }
    }

    const t2 = {}

    expect(hasReimbursements(t1)).toBe(false)
    expect(hasReimbursements(t2)).toBe(false)
  })
})

describe('hasBills', () => {
  it('should return true if the transaction has bills', () => {
    const transaction = {
      bills: {
        data: [{ amount: 10 }]
      }
    }

    expect(hasBills(transaction)).toBe(true)
  })

  it('should return false if the transaction does not have bills', () => {
    const t1 = {
      bills: {
        data: []
      }
    }

    const t2 = {}

    expect(hasBills(t1)).toBe(false)
    expect(hasBills(t2)).toBe(false)
  })
})

describe('isAlreadyNotified', () => {
  it('should return true if the transaction has already been notified', () => {
    const transaction = {
      cozyMetadata: {
        notifications: {
          notificationType: ['2019-06-14']
        }
      }
    }

    const notificationClass = { settingKey: 'notificationType' }

    expect(isAlreadyNotified(transaction, notificationClass)).toBe(true)
  })

  it('should return false if the transaction has not already been notified', () => {
    const t1 = {
      cozyMetadata: {
        notifications: {
          otherNotificationType: ['2019-06-14']
        }
      }
    }

    const t2 = {
      cozyMetadata: {
        notifications: {}
      }
    }

    const t3 = {
      cozyMetadata: {}
    }

    const t4 = {}

    const notificationClass = { settingKey: 'notificationType' }

    expect(isAlreadyNotified(t1, notificationClass)).toBe(false)
    expect(isAlreadyNotified(t2, notificationClass)).toBe(false)
    expect(isAlreadyNotified(t3, notificationClass)).toBe(false)
    expect(isAlreadyNotified(t4, notificationClass)).toBe(false)
  })
})

describe('updateApplicationDate', () => {
  const setup = () => {
    const client = new CozyClient({})
    jest.spyOn(client, 'save').mockImplementation(doc => ({ data: doc }))
    return { client }
  }

  it('should save the document', async () => {
    const { client } = setup()
    const doc = await updateApplicationDate(
      client,
      {
        date: '2019-08-07T12:00'
      },
      '2019-09-01'
    )
    expect(client.save).toHaveBeenCalledWith({
      date: '2019-08-07T12:00',
      applicationDate: '2019-09-01'
    })
    expect(getApplicationDate(doc)).toBe('2019-09-01')
  })

  it('should reset the applicationDate if changed to same month as display date', async () => {
    const { client } = setup()
    await updateApplicationDate(
      client,
      {
        date: '2019-09-07T12:00'
      },
      '2019-09-01'
    )
    expect(client.save).toHaveBeenCalledWith({
      date: '2019-09-07T12:00',
      applicationDate: ''
    })
  })
})

describe('updateTransactionRecurrence', () => {
  const setup = ({ recurrenceTransactions } = {}) => {
    const client = new CozyClient({ schema })
    jest.spyOn(client, 'save').mockImplementation(doc => ({ data: doc }))
    jest.spyOn(client, 'destroy').mockImplementation(doc => ({ data: doc }))
    jest.spyOn(client, 'query').mockImplementation(qdef => {
      if (qdef.doctype === TRANSACTION_DOCTYPE) {
        return { data: recurrenceTransactions }
      } else if (qdef.doctype === RECURRENCE_DOCTYPE && qdef.id) {
        return { data: { _id: qdef.id } }
      } else {
        throw new Error(
          `client.query is not mocked for the query definition ${JSON.stringify(
            qdef
          )}`
        )
      }
    })

    const transaction = client.hydrateDocument({
      _id: 'transaction-1',
      _type: TRANSACTION_DOCTYPE,
      label: 'My transaction',
      amount: 50,
      relationships: {
        recurrence: {
          data: {
            _id: 'old-recurrence-id',
            _type: RECURRENCE_DOCTYPE
          }
        }
      }
    })
    return { client, transaction }
  }

  it('should save the transaction', async () => {
    const { client, transaction } = setup({ recurrenceTransactions: [] })
    const newRecurrence = {
      _id: 'new-recurrence-id',
      _type: RECURRENCE_DOCTYPE
    }
    await updateTransactionRecurrence(client, transaction, newRecurrence)
    expect(client.save).toHaveBeenCalledWith(
      expect.objectContaining({
        relationships: expect.objectContaining({
          recurrence: expect.objectContaining({
            data: expect.objectContaining({
              _id: 'new-recurrence-id'
            })
          })
        })
      })
    )
  })

  it('should delete the recurrence if its empty', async () => {
    const { client, transaction } = setup({
      recurrenceTransactions: []
    })
    const newRecurrence = {
      _id: 'new-recurrence-id',
      _type: RECURRENCE_DOCTYPE
    }
    await updateTransactionRecurrence(client, transaction, newRecurrence)
    expect(client.destroy).toHaveBeenCalledWith({ _id: 'old-recurrence-id' })
  })

  it('should not delete the recurrence if its not empty', async () => {
    const { client, transaction } = setup({
      recurrenceTransactions: [{ _id: 'transaction-2' }]
    })
    const newRecurrence = {
      _id: 'new-recurrence-id',
      _type: RECURRENCE_DOCTYPE
    }
    await updateTransactionRecurrence(client, transaction, newRecurrence)
    expect(client.destroy).not.toHaveBeenCalled()
  })
})

describe('computeTransactionsByDateAndApplicationDate', () => {
  it('should return empty array if datas are null', () => {
    const transactionsByDate = null
    const transactionsByApplicationDate = null

    expect(
      computeTransactionsByDateAndApplicationDate({
        transactionsByDate,
        transactionsByApplicationDate
      })
    ).toMatchObject([])
  })

  it('should not include transactionsByDate with applicationDate prop', () => {
    const transactionsByDate = [
      { id: '01', applicationDate: '2021-07-01' },
      { id: '02' }
    ]
    const transactionsByApplicationDate = []

    expect(
      computeTransactionsByDateAndApplicationDate({
        transactionsByDate,
        transactionsByApplicationDate
      })
    ).toMatchObject([{ id: '02' }])
  })

  it('should merge transactionsByDate and transactionsByApplicationDate', () => {
    const transactionsByDate = [{ id: '01' }]
    const transactionsByApplicationDate = [
      { id: '02', applicationDate: '2021-07-01' }
    ]

    expect(
      computeTransactionsByDateAndApplicationDate({
        transactionsByDate,
        transactionsByApplicationDate
      })
    ).toMatchObject([{ id: '01' }, { id: '02', applicationDate: '2021-07-01' }])
  })
})
