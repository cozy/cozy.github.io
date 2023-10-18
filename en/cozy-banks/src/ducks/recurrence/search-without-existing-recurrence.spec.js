import sortBy from 'lodash/sortBy'

import { TRANSACTION_DOCTYPE } from 'doctypes'

import { findAndUpdateRecurrences } from './search'
import fixtures from './fixtures/fixtures.json'
import fixtures2 from './fixtures/fixtures2.json'
import fixtures3 from './fixtures/fixtures3.json'
import { assertValidRecurrence, formatRecurrence } from './search-utils'
import brands from 'ducks/brandDictionary/brands'
import getClient from 'selectors/getClient'

jest.mock('selectors/getClient', () => jest.fn())

describe('recurrence bundles (without existing recurrence)', () => {
  getClient.mockReturnValue({
    store: {
      getState: () => ({ brands })
    }
  })
  it('should find new bundles (fixtures1)', () => {
    const transactions = fixtures[TRANSACTION_DOCTYPE]
    const recurrences = []
    const updatedRecurrences = findAndUpdateRecurrences(
      recurrences,
      transactions
    )

    updatedRecurrences.forEach(assertValidRecurrence)
    // eslint-disable
    expect(
      '\n' + sortBy(updatedRecurrences.map(formatRecurrence)).join('\n')
    ).toMatchSnapshot()
  })

  it('should find new bundles (fixtures3)', () => {
    const transactions = fixtures3[TRANSACTION_DOCTYPE]
    const recurrences = []
    const updatedRecurrences = findAndUpdateRecurrences(
      recurrences,
      transactions
    )

    updatedRecurrences.forEach(assertValidRecurrence)
    // eslint-disable
    expect(
      '\n' + sortBy(updatedRecurrences.map(formatRecurrence)).join('\n')
    ).toMatchSnapshot()
  })

  describe('brand', () => {
    it('should find new bundles (split brand necessary)', () => {
      const transactions = fixtures2[TRANSACTION_DOCTYPE]
      const recurrences = []
      const updatedRecurrences = findAndUpdateRecurrences(
        recurrences,
        transactions
      )

      updatedRecurrences.forEach(assertValidRecurrence)
      // eslint-disable
      expect(
        '\n' + sortBy(updatedRecurrences.map(formatRecurrence)).join('\n')
      ).toMatchSnapshot()
    })
  })

  describe('date', () => {
    it('should create bundles even with 3 months gap after monthly transactions', () => {
      const transactions = [
        {
          _id: 'january',
          amount: -50,
          date: '2021-01-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'february',
          amount: -50,
          date: '2021-02-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'march',
          amount: -50,
          date: '2021-03-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'july',
          amount: -50,
          date: '2021-07-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        }
      ]

      const expectedBundles = [
        {
          categoryIds: ['NetflixId'],
          amounts: [-50],
          ops: transactions,
          automaticLabel: 'Netflix',
          brand: 'Netflix',
          stats: {
            deltas: {
              sigma: 43.62211467694899,
              mean: 60.333333333333336,
              median: 31,
              mad: 3
            }
          }
        }
      ]

      const bundles = findAndUpdateRecurrences([], transactions)

      expect(bundles).toMatchObject(expectedBundles)
    })

    it('should create bundles even with 3 months gap before monthly transactions', () => {
      const transactions = [
        {
          _id: 'january',
          amount: -50,
          date: '2021-01-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'may',
          amount: -50,
          date: '2021-05-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'june',
          amount: -50,
          date: '2021-06-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'july',
          amount: -50,
          date: '2021-07-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        }
      ]

      const expectedBundles = [
        {
          categoryIds: ['NetflixId'],
          amounts: [-50],
          ops: transactions,
          automaticLabel: 'Netflix',
          brand: 'Netflix',
          stats: {
            deltas: {
              sigma: 42.19267972317262,
              mean: 60.333333333333336,
              median: 31,
              mad: 1
            }
          }
        }
      ]

      const bundles = findAndUpdateRecurrences([], transactions)

      expect(bundles).toMatchObject(expectedBundles)
    })

    it('should not create bundles for 2 monthly transactions and a 1 month gap (mad > 5)', () => {
      const transactions = [
        {
          _id: 'january',
          amount: -50,
          date: '2021-01-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'february',
          amount: -50,
          date: '2021-02-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'april',
          amount: -50,
          date: '2021-04-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        }
      ]

      const expectedBundles = []

      const bundles = findAndUpdateRecurrences([], transactions)

      expect(bundles).toMatchObject(expectedBundles)
    })

    it('should create bundles for at least 3 monthly transactions', () => {
      const transactions = [
        {
          _id: 'january',
          amount: -50,
          date: '2021-01-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'february',
          amount: -50,
          date: '2021-02-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'march',
          amount: -50,
          date: '2021-03-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        }
      ]

      const expectedBundles = [
        {
          categoryIds: ['NetflixId'],
          amounts: [-50],
          ops: transactions,
          automaticLabel: 'Netflix',
          brand: 'Netflix',
          stats: {
            deltas: { sigma: 1.5, mean: 29.5, median: 29.5, mad: 1.5 }
          }
        }
      ]

      const bundles = findAndUpdateRecurrences([], transactions)

      expect(bundles).toMatchObject(expectedBundles)
    })

    it('should create bundles also for 6 monthly transactions', () => {
      const transactions = [
        {
          _id: 'january',
          amount: -50,
          date: '2021-01-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'february',
          amount: -50,
          date: '2021-02-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'march',
          amount: -50,
          date: '2021-03-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'april',
          amount: -50,
          date: '2021-04-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'may',
          amount: -50,
          date: '2021-05-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'june',
          amount: -50,
          date: '2021-06-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        }
      ]

      const expectedBundles = [
        {
          categoryIds: ['NetflixId'],
          amounts: [-50],
          ops: transactions,
          automaticLabel: 'Netflix',
          brand: 'Netflix',
          stats: {
            deltas: {
              sigma: 1.1661903789690757,
              mean: 30.2,
              median: 31,
              mad: 0
            }
          }
        }
      ]

      const bundles = findAndUpdateRecurrences([], transactions)

      expect(bundles).toMatchObject(expectedBundles)
    })

    it('should not create bundles for less than 3 monthly transactions', () => {
      const transactions = [
        {
          _id: 'january',
          amount: -50,
          date: '2021-01-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        },
        {
          _id: 'february',
          amount: -50,
          date: '2021-02-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0'
        }
      ]

      const expectedBundles = []

      const bundles = findAndUpdateRecurrences([], transactions)

      expect(bundles).toMatchObject(expectedBundles)
    })
  })

  describe('account', () => {
    it('should create bundle even if transaction are not from the same account', () => {
      const transactions = [
        {
          _id: 'january',
          amount: -50,
          date: '2021-01-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0',
          account: 'accountId'
        },
        {
          _id: 'february',
          amount: -50,
          date: '2021-02-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0',
          account: 'accountId'
        },
        {
          _id: 'march',
          amount: -50,
          date: '2021-03-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0',
          account: 'otherAccountId'
        }
      ]

      const expectedBundles = [
        {
          categoryIds: ['NetflixId'],
          amounts: [-50],
          ops: transactions,
          automaticLabel: 'Netflix',
          brand: 'Netflix',
          stats: { deltas: { sigma: 1.5, mean: 29.5, median: 29.5, mad: 1.5 } }
        }
      ]

      const bundles = findAndUpdateRecurrences([], transactions)

      expect(bundles).toMatchObject(expectedBundles)
    })
  })
})
