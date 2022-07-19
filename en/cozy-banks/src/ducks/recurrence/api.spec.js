import keyBy from 'lodash/keyBy'

import CozyClient from 'cozy-client'

import { TRANSACTION_DOCTYPE, RECURRENCE_DOCTYPE } from 'doctypes'
import fixtures from 'test/fixtures'
import fixtures4 from './fixtures/fixtures4.json'
import {
  fetchHydratedBundles,
  createRecurrenceClientBundles,
  saveHydratedBundles
} from './api'

describe('fetch hydrated bundles', () => {
  const setup = () => {
    const client = new CozyClient()
    client.queryAll = jest.fn().mockImplementation(async qdef => {
      if (qdef.doctype === TRANSACTION_DOCTYPE) {
        return fixtures[TRANSACTION_DOCTYPE]
      } else if (qdef.doctype === RECURRENCE_DOCTYPE) {
        return fixtures[RECURRENCE_DOCTYPE]
      } else {
        throw new Error(`Unexpected doctype ${qdef.doctype} in queryAll`)
      }
    })
    client.collection = jest.fn().mockImplementation(col => {
      if (col === TRANSACTION_DOCTYPE) {
        return {
          updateAll: jest.fn().mockImplementation(async data => data)
        }
      } else {
        throw new Error(`Unexpected doctype ${col} in collection`)
      }
    })
    return { client }
  }

  it('should use query all to fetch more than the default pagination limit', async () => {
    const { client } = setup()
    await fetchHydratedBundles(client)
    expect(client.queryAll).toHaveBeenCalledTimes(2)
  })

  it('should use put operations pertaining to the bundle inside the ops attribute', async () => {
    const { client } = setup()
    const bundles = await fetchHydratedBundles(client)
    expect(bundles.length).toBe(3)
    expect(bundles[0].ops.length).toEqual(3)
    expect(bundles[1].ops.length).toEqual(0)
    expect(bundles[2].ops.length).toEqual(0)
  })
})

describe('createRecurrenceClientBundles', () => {
  it('should add latestDate, latestAmount and automaticLabel, remove ops and make accounts unique', () => {
    const transactionsByKey = keyBy(fixtures4[TRANSACTION_DOCTYPE], '_id')
    const transactions = [
      transactionsByKey['february'],
      transactionsByKey['march'],
      transactionsByKey['april'],
      transactionsByKey['may']
    ]

    const recurrences = [
      {
        categoryIds: ['200110'],
        amounts: [2000, 2150],
        accounts: [
          '1d22740c6c510e5368d1b6b670deee05',
          '1d22740c6c510e5368d1b6b670deee05'
        ],
        ops: transactions
      }
    ]

    const recurrenceClientBundles = createRecurrenceClientBundles(recurrences)

    expect(recurrenceClientBundles).toEqual([
      {
        categoryIds: ['200110'],
        amounts: [2000, 2150],
        accounts: ['1d22740c6c510e5368d1b6b670deee05'],
        latestDate: '2021-05-01T12:00:00.000Z',
        automaticLabel: 'Mon Salaire Fevrier',
        latestAmount: 2150
      }
    ])
  })
})

describe('saveHydratedBundles', () => {
  const setup = () => {
    const client = new CozyClient()
    const collections = {
      [TRANSACTION_DOCTYPE]: {
        updateAll: jest
          .fn()
          .mockImplementation(async data =>
            data.map(d => ({ ...d, id: d._id }))
          )
      },
      [RECURRENCE_DOCTYPE]: {
        updateAll: jest
          .fn()
          .mockImplementation(async data =>
            data.map(d => ({ ...d, id: d._id }))
          )
      }
    }
    client.collection = jest
      .fn()
      .mockImplementation(doctype => collections[doctype])
    return { client }
  }

  it('should add bundle relationship to transactions missing it', async () => {
    const { client } = setup()
    const transactionsByKey = keyBy(fixtures4[TRANSACTION_DOCTYPE], '_id')
    const transactions = [
      transactionsByKey['february'],
      transactionsByKey['april']
    ]
    const recurrence = {
      _id: 1234,
      categoryIds: ['200110'],
      amounts: [2000, 2150],
      accounts: [
        '1d22740c6c510e5368d1b6b670deee05',
        '1d22740c6c510e5368d1b6b670deee05'
      ],
      ops: transactions
    }

    await saveHydratedBundles(client, [recurrence])
    expect(
      client.collection(TRANSACTION_DOCTYPE).updateAll
    ).toHaveBeenCalledTimes(1)

    const updatedTransactions = transactions.map(op => ({
      ...op,
      relationships: {
        recurrence: {
          data: { _id: recurrence._id, _type: RECURRENCE_DOCTYPE }
        }
      }
    }))
    expect(
      client.collection(TRANSACTION_DOCTYPE).updateAll
    ).toHaveBeenCalledWith(updatedTransactions)

    // Update `ops` with "saved" transactions to mimick a second service call
    recurrence.ops = updatedTransactions
    client.collection(TRANSACTION_DOCTYPE).updateAll.mockClear()

    recurrence.ops.push(transactionsByKey['march'])

    await saveHydratedBundles(client, [recurrence])
    expect(
      client.collection(TRANSACTION_DOCTYPE).updateAll
    ).toHaveBeenCalledTimes(1)
    expect(
      client.collection(TRANSACTION_DOCTYPE).updateAll
    ).toHaveBeenCalledWith([
      {
        ...transactionsByKey['march'],
        relationships: {
          recurrence: {
            data: { _id: recurrence._id, _type: RECURRENCE_DOCTYPE }
          }
        }
      }
    ])
  })
})
