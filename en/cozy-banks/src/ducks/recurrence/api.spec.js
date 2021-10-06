import keyBy from 'lodash/keyBy'

import CozyClient from 'cozy-client'

import { TRANSACTION_DOCTYPE, RECURRENCE_DOCTYPE } from 'doctypes'
import fixtures from 'test/fixtures'
import fixtures4 from './fixtures/fixtures4.json'
import { fetchHydratedBundles, createRecurrenceClientBundles } from './api'

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
