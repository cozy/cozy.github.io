import CozyClient from 'cozy-client'
import { fetchExpensesForAlert } from './index.js'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'

const alert = {
  categoryId: '400100',
  maxThresold: 100
}

/**
 * Creates a function suitable for mocking CozyClient::query with
 * existing data
 *
 * @private
 */
const makeQueryMock = existingData => {
  return async spec => {
    if (existingData[spec.doctype]) {
      return {
        data: existingData[spec.doctype]
      }
    } else {
      return {
        data: []
      }
    }
  }
}

describe('fetch transactions for alert', () => {
  const setup = () => {
    const client = new CozyClient({})
    client.query = jest.fn().mockResolvedValue({ data: [] })
    return { client }
  }

  it('should query with the right selector (no accountGroup)', async () => {
    const { client } = setup()
    const currentDate = new Date('2019-12-01')
    await fetchExpensesForAlert(client, alert, currentDate)
    expect(client.query).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: {
          amount: {
            $lt: 0
          },
          date: {
            $lt: '2020-01',
            $gt: '2019-12'
          }
        }
      })
    )
  })

  it('should query with the right selector (account)', async () => {
    const { client } = setup()
    const currentDate = new Date('2019-12-01')
    await fetchExpensesForAlert(
      client,
      {
        ...alert,
        accountOrGroup: {
          _type: ACCOUNT_DOCTYPE,
          _id: 'c0ffeedeadbeef'
        }
      },
      currentDate
    )
    expect(client.query).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: {
          amount: {
            $lt: 0
          },
          account: 'c0ffeedeadbeef',
          date: {
            $lt: '2020-01',
            $gt: '2019-12'
          }
        }
      })
    )
  })

  it('should query with the right selector (group)', async () => {
    const { client } = setup()
    const currentDate = new Date('2019-12-01')
    client.query.mockImplementation(
      makeQueryMock({
        [GROUP_DOCTYPE]: {
          accounts: ['acc1', 'acc2', 'acc3']
        }
      })
    )
    await fetchExpensesForAlert(
      client,
      {
        ...alert,
        accountOrGroup: {
          _type: GROUP_DOCTYPE,
          _id: 'groupId'
        }
      },
      currentDate
    )

    // At the moment we do not filter at query time, we filter transactions in the service
    expect(client.query).toHaveBeenCalledWith(
      expect.objectContaining({
        selector: {
          amount: {
            $lt: 0
          },
          date: {
            $lt: '2020-01',
            $gt: '2019-12'
          }
        }
      })
    )
  })
})
