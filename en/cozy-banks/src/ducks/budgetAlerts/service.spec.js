import CozyClient, { createMockClient } from 'cozy-client'
import { TRANSACTION_DOCTYPE } from 'doctypes'
import fixture from 'test/fixtures/unit-tests.json'
import { runCategoryBudgetService } from './service'
import {
  fetchCategoryAlerts,
  updateCategoryAlerts
} from 'ducks/settings/helpers'
import MockDate from 'mockdate'

jest.mock('ducks/settings/helpers', () => ({
  fetchCategoryAlerts: jest.fn(),
  updateCategoryAlerts: jest.fn()
}))

global.fetch = require('isomorphic-fetch')

const MOCKED_DATE = '2017-07-15T12:00:00.210Z'

beforeAll(() => {
  MockDate.set(MOCKED_DATE)
})

afterAll(() => {
  MockDate.reset()
})

const settings = {
  budgetAlerts: [
    {
      maxThreshold: 100,
      categoryId: '400610'
    }
  ]
}

beforeEach(() => {
  fetchCategoryAlerts.mockReset()
  updateCategoryAlerts.mockReset()
})

describe('service', () => {
  const setup = ({ budgetAlerts, expenses }) => {
    fetchCategoryAlerts.mockReturnValue(budgetAlerts)
    const client = createMockClient({
      remote: {
        [TRANSACTION_DOCTYPE]: expenses
      },
      clientOptions: {
        uri: 'https://test.mycozy.cloud'
      }
    })
    const original = client.stackClient.fetchJSON
    const mockPostNotification = jest.fn()
    client.stackClient.fetchJSON = function (method, route, data) {
      if (method === 'POST' && route === '/notifications') {
        return mockPostNotification(data)
      } else {
        return original.apply(this, arguments)
      }
    }
    return { client, mockPostNotification }
  }

  const julyExpenses = fixture['io.cozy.bank.operations'].filter(
    x => x.amount < 0 && x.date.slice(0, 7) === '2017-07'
  )

  it('should send a notification when sum of expenses > alert threshold', async () => {
    const { client, mockPostNotification } = setup({
      budgetAlerts: settings.budgetAlerts,
      expenses: julyExpenses
    })
    await runCategoryBudgetService(client, { currentDate: '2019-07-15' })
    expect(fetchCategoryAlerts).toHaveBeenCalledWith(expect.any(CozyClient))
    expect(updateCategoryAlerts).toHaveBeenCalledWith(expect.any(CozyClient), [
      {
        maxThreshold: 100,
        categoryId: '400610',
        lastNotificationAmount: 251,
        lastNotificationDate: '2017-07-15'
      }
    ])
    expect(mockPostNotification).toHaveBeenCalledTimes(1)
  })

  describe('parent category', () => {
    it('should send a notification when sum of expenses > alert threshold', async () => {
      const DAILY_LIFE_ID = '400100'
      const { client, mockPostNotification } = setup({
        budgetAlerts: [
          {
            ...settings.budgetAlerts[0],
            categoryId: DAILY_LIFE_ID,
            categoryIsParent: true
          }
        ],
        expenses: julyExpenses
      })
      await runCategoryBudgetService(client, { currentDate: '2019-07-15' })
      expect(fetchCategoryAlerts).toHaveBeenCalledWith(expect.any(CozyClient))
      expect(updateCategoryAlerts).toHaveBeenCalledWith(
        expect.any(CozyClient),
        [
          {
            maxThreshold: 100,
            categoryId: DAILY_LIFE_ID,
            categoryIsParent: true,
            lastNotificationAmount: 735,
            lastNotificationDate: '2017-07-15'
          }
        ]
      )
      expect(mockPostNotification).toHaveBeenCalledTimes(1)
      expect(
        mockPostNotification.mock.calls[0][0].data.attributes.message
      ).toEqual('735€ > 100€')
    })
  })

  it('should not update alerts, nor send a notification when there are no expenses', async () => {
    const { client, mockPostNotification } = setup({
      budgetAlerts: settings.budgetAlerts,
      expenses: []
    })
    await runCategoryBudgetService(client, { currentDate: '2019-07-15' })
    expect(fetchCategoryAlerts).toHaveBeenCalledWith(expect.any(CozyClient))
    expect(updateCategoryAlerts).not.toHaveBeenCalled()
    expect(mockPostNotification).not.toHaveBeenCalled()
  })

  it('should not send a notification when amount < threshold', async () => {
    const { client, mockPostNotification } = setup({
      budgetAlerts: settings.budgetAlerts,
      expenses: [{ amount: -10, label: 'Test' }]
    })
    await runCategoryBudgetService(client, { currentDate: '2019-07-15' })
    expect(fetchCategoryAlerts).toHaveBeenCalledWith(expect.any(CozyClient))
    expect(updateCategoryAlerts).not.toHaveBeenCalledWith()
    expect(mockPostNotification).not.toHaveBeenCalled()
  })

  it('should not send/update alerts whose threshold has not been passed', async () => {
    const budgetAlert = settings.budgetAlerts[0]
    const { client, mockPostNotification } = setup({
      budgetAlerts: [
        { ...budgetAlert, maxThreshold: 10 },
        { ...budgetAlert, maxThreshold: 200 },
        { ...budgetAlert, maxThreshold: 1000 }
      ],
      expenses: julyExpenses
    })
    await runCategoryBudgetService(client, { currentDate: '2019-07-15' })
    expect(fetchCategoryAlerts).toHaveBeenCalledWith(expect.any(CozyClient))
    expect(updateCategoryAlerts).toHaveBeenCalledWith(expect.any(CozyClient), [
      {
        categoryId: '400610',
        lastNotificationAmount: 251,
        lastNotificationDate: '2017-07-15',
        maxThreshold: 10
      },
      {
        categoryId: '400610',
        lastNotificationAmount: 251,
        lastNotificationDate: '2017-07-15',
        maxThreshold: 200
      },
      { categoryId: '400610', maxThreshold: 1000 }
    ])
    expect(mockPostNotification).toHaveBeenCalled()
  })

  it('should not send/update an alert which has a notification amount equal or superior to last notification amount', async () => {
    const budgetAlert = settings.budgetAlerts[0]
    const { client, mockPostNotification } = setup({
      budgetAlerts: [
        {
          ...budgetAlert,
          lastNotificationDate: '2019-07-16',
          lastNotificationAmount: 251
        }
      ],
      expenses: julyExpenses
    })
    await runCategoryBudgetService(client, { currentDate: '2019-07-15' })
    expect(updateCategoryAlerts).not.toHaveBeenCalled()
    expect(mockPostNotification).not.toHaveBeenCalled()
  })

  it('should send/update an alert which has a notification amount inferior to last notification amount', async () => {
    const budgetAlert = settings.budgetAlerts[0]
    const { client, mockPostNotification } = setup({
      budgetAlerts: [
        {
          ...budgetAlert,
          lastNotificationDate: '2019-07-16',
          lastNotificationAmount: 250
        }
      ],
      expenses: julyExpenses
    })
    await runCategoryBudgetService(client, { currentDate: '2019-07-15' })
    expect(updateCategoryAlerts).toHaveBeenCalled()
    expect(mockPostNotification).toHaveBeenCalled()
  })

  describe('push/email content', () => {
    it('should have the correct content (single)', async () => {
      const budgetAlert = settings.budgetAlerts[0]
      const { client, mockPostNotification } = setup({
        budgetAlerts: [budgetAlert],
        expenses: julyExpenses
      })
      await runCategoryBudgetService(client, { currentDate: '2019-07-15' })

      const lastPostNotificationCall =
        mockPostNotification.mock.calls.slice(-1)[0][0]
      expect(lastPostNotificationCall.data.attributes.title).toEqual(
        'Health expenses budget has exceeded its limit'
      )
      expect(lastPostNotificationCall.data.attributes.message).toEqual(
        '251€ > 100€'
      )
    })

    it('should have the correct content (multi)', async () => {
      const GOING_OUT_CATEGORY_ID = '400800'
      const budgetAlert = settings.budgetAlerts[0]
      const { client, mockPostNotification } = setup({
        budgetAlerts: [
          budgetAlert,
          {
            ...budgetAlert,
            maxThreshold: 10,
            categoryId: GOING_OUT_CATEGORY_ID,
            categoryIsParent: true
          }
        ],
        expenses: [
          ...julyExpenses,
          { ...julyExpenses[0], manualCategoryId: GOING_OUT_CATEGORY_ID }
        ]
      })
      await runCategoryBudgetService(client, { currentDate: '2019-07-15' })

      const lastPostNotificationCall =
        mockPostNotification.mock.calls.slice(-1)[0][0]
      expect(lastPostNotificationCall.data.attributes.title).toEqual(
        '2 budgets have exceeded their limit'
      )
      expect(lastPostNotificationCall.data.attributes.message).toEqual(
        'Health expenses: 251€ > 100€\nOutings, trips: 68€ > 10€'
      )
    })
  })
})
