import keyBy from 'lodash/keyBy'
import sortBy from 'lodash/sortBy'

import { TRANSACTION_DOCTYPE } from 'doctypes'

import { findAndUpdateRecurrences } from './search'

import fixtures4 from './fixtures/fixtures4.json'
import fixtures5 from './fixtures/fixtures5.json'
import fixtures6 from './fixtures/fixtures6.json'
import { getT, enLocaleOption } from 'utils/lang'
import * as utils from './utils'
const { getFrequencyText } = utils
import fixtures from './fixtures/fixtures.json'
import { assertValidRecurrence, formatRecurrence } from './search-utils'

describe('recurrence bundles (with existing recurrences)', () => {
  describe('amount', () => {
    const transactionsByKey = keyBy(fixtures4[TRANSACTION_DOCTYPE], '_id')
    const transactions = [
      transactionsByKey['february'],
      transactionsByKey['march'],
      transactionsByKey['april']
    ]
    const mayTransaction = transactionsByKey['may']
    const juneTransaction = transactionsByKey['june']

    const recurrence = {
      categoryIds: ['200110'],
      amounts: [2000, 2150],
      accounts: ['1d22740c6c510e5368d1b6b670deee05'],
      ops: [...transactions, mayTransaction],
      automaticLabel: 'Mon Salaire'
    }

    it('should reattach new operations to the current recurrence, in the event that the amount of the new transaction is different from the previous one', () => {
      juneTransaction.amount = 2000

      const bundleWithJune = findAndUpdateRecurrences(
        [recurrence],
        [juneTransaction]
      )

      const bundle = bundleWithJune[0]
      const [op1, op2, op3, op4, op5] = bundle.ops

      expect(bundleWithJune.length).toBe(1)
      expect(bundle.categoryIds[0]).toBe('200110')
      expect(bundle.amounts).toMatchObject([2000, 2150])
      expect(bundle.ops.length).toBe(5)
      expect(op1).toMatchObject({ _id: 'february', amount: 2000 })
      expect(op2).toMatchObject({ _id: 'march', amount: 2000 })
      expect(op3).toMatchObject({ _id: 'april', amount: 2000 })
      expect(op4).toMatchObject({ _id: 'may', amount: 2150 })
      expect(op5).toMatchObject({ _id: 'june', amount: 2000 })
    })

    it('should reattach new operations to the current recurrence, in the event that the amount of the new transaction is the same from the previous one', () => {
      juneTransaction.amount = 2150

      const bundleWithJune = findAndUpdateRecurrences(
        [recurrence],
        [juneTransaction]
      )

      const bundle = bundleWithJune[0]
      const [op1, op2, op3, op4, op5] = bundle.ops

      expect(bundleWithJune.length).toBe(1)
      expect(bundle.categoryIds[0]).toBe('200110')
      expect(bundle.amounts).toMatchObject([2000, 2150])
      expect(bundle.ops.length).toBe(5)
      expect(op1).toMatchObject({ _id: 'february', amount: 2000 })
      expect(op2).toMatchObject({ _id: 'march', amount: 2000 })
      expect(op3).toMatchObject({ _id: 'april', amount: 2000 })
      expect(op4).toMatchObject({ _id: 'may', amount: 2150 })
      expect(op5).toMatchObject({ _id: 'june', amount: 2150 })
    })

    it('should not reattach the new operations which do not correspond to one of the recurrence amounts', () => {
      juneTransaction.amount = 2100

      const bundleWithJune = findAndUpdateRecurrences(
        [recurrence],
        [juneTransaction]
      )

      expect(bundleWithJune.length).toBe(1)

      const bundle = bundleWithJune[0]
      const [op1, op2, op3, op4] = bundle.ops

      expect(bundle.categoryIds[0]).toBe('200110')
      expect(bundle.amounts).toMatchObject([2000, 2150])
      expect(bundle.ops.length).toBe(4)
      expect(op1).toMatchObject({ _id: 'february', amount: 2000 })
      expect(op2).toMatchObject({ _id: 'march', amount: 2000 })
      expect(op3).toMatchObject({ _id: 'april', amount: 2000 })
      expect(op4).toMatchObject({ _id: 'may', amount: 2150 })
    })
  })

  describe('brand', () => {
    const transactionsByKey = keyBy(fixtures4[TRANSACTION_DOCTYPE], '_id')
    const transactions = [
      transactionsByKey['february'],
      transactionsByKey['march'],
      transactionsByKey['april']
    ]
    const mayTransaction = transactionsByKey['may']

    const recurrence = {
      categoryIds: ['200110'],
      amounts: [2000, 2150],
      accounts: ['1d22740c6c510e5368d1b6b670deee05'],
      ops: [...transactions, mayTransaction],
      automaticLabel: 'Mon Salaire'
    }
    it('should reattach new operations to the current recurrence with Spotify Brand', () => {
      const juneSpot = transactionsByKey['june-spotify']
      const julySpot = transactionsByKey['july-spotify']
      const recurrenceSpot = {
        brand: 'Spotify',
        categoryIds: ['400100'],
        amounts: [10],
        accounts: ['1d22740c6c510e5368d1b6b670deee05'],
        ops: [juneSpot],
        automaticLabel: 'Spotify Abonnement'
      }

      const bundles = sortBy(
        findAndUpdateRecurrences([recurrence, recurrenceSpot], [julySpot]),
        b => b.brand
      )

      expect(bundles.length).toBe(2)
      const bundle = bundles[0]

      expect(bundle.brand).toBe('Spotify')
      expect(bundle.categoryIds[0]).toBe('400100')
      expect(bundle.amounts).toMatchObject([10])
      expect(bundle.ops.length).toBe(2)

      const bundle2 = bundles[1]
      const [op1, op2, op3, op4] = bundle2.ops

      expect(bundle2.brand).toBe(undefined)
      expect(bundle2.categoryIds[0]).toBe('200110')
      expect(bundle2.amounts).toMatchObject([2000, 2150])
      expect(bundle2.ops.length).toBe(4)
      expect(op1).toMatchObject({ _id: 'february', amount: 2000 })
      expect(op2).toMatchObject({ _id: 'march', amount: 2000 })
      expect(op3).toMatchObject({ _id: 'april', amount: 2000 })
      expect(op4).toMatchObject({ _id: 'may', amount: 2150 })
    })
  })

  describe('account', () => {
    it('should update existing bundle only with transactions on the same account', () => {
      const oldTransactions = [
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
          account: 'accountId'
        }
      ]

      const recurrences = [
        {
          categoryIds: ['NetflixId'],
          amounts: [-50],
          ops: oldTransactions,
          automaticLabel: 'Netflix',
          brand: 'Netflix',
          stats: {
            deltas: { sigma: 1.5, mean: 29.5, median: 29.5, mad: 1.5 }
          },
          accounts: ['accountId']
        }
      ]

      const transactions = [
        {
          _id: 'april',
          amount: -50,
          date: '2021-04-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0',
          account: 'accountId'
        },
        {
          _id: 'may',
          amount: -50,
          date: '2021-05-01T12:00:00.000Z',
          label: 'Netflix',
          automaticCategoryId: 'NetflixId',
          localCategoryId: '0',
          account: 'otherAccountId'
        },
        {
          _id: 'june',
          amount: -50,
          date: '2021-06-01T12:00:00.000Z',
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
          ops: [...oldTransactions, ...[transactions[0]]],
          automaticLabel: 'Netflix',
          brand: 'Netflix',
          stats: {
            deltas: { sigma: 1.4142135623730951, mean: 30, median: 31, mad: 0 }
          },
          accounts: ['accountId']
        }
      ]

      const newBundles = findAndUpdateRecurrences(recurrences, transactions)

      expect(newBundles).toMatchObject(expectedBundles)
    })
  })

  it('should update existing bundle if the transactions matches', () => {
    const oldTransactions = [
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
        account: 'accountId'
      }
    ]

    const recurrences = [
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: oldTransactions,
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: {
          deltas: { sigma: 1.5, mean: 29.5, median: 29.5, mad: 1.5 }
        },
        accounts: ['accountId']
      }
    ]

    // test for one more transaction

    const oneTransactions = [
      {
        _id: 'april',
        amount: -50,
        date: '2021-04-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'accountId'
      }
    ]

    const expectedBundlesForOneTransaction = [
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: [...oldTransactions, ...oneTransactions],
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: {
          deltas: { sigma: 1.4142135623730951, mean: 30, median: 31, mad: 0 }
        },
        accounts: ['accountId']
      }
    ]

    const newBundles = findAndUpdateRecurrences(recurrences, oneTransactions)

    expect(newBundles).toMatchObject(expectedBundlesForOneTransaction)

    // test for 3 more transactions

    const threeTransactions = [
      {
        _id: 'april',
        amount: -50,
        date: '2021-04-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'may',
        amount: -50,
        date: '2021-05-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'june',
        amount: -50,
        date: '2021-06-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'accountId'
      }
    ]

    expect(
      findAndUpdateRecurrences(recurrences, threeTransactions)
    ).toMatchObject([
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: [...oldTransactions, ...threeTransactions],
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: {
          deltas: { sigma: 1.1661903789690757, mean: 30.2, median: 31, mad: 0 }
        },
        accounts: ['accountId']
      }
    ])
  })

  it('should not assign transaction to existing recurrence if not same account', () => {
    const oldTransactions = [
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
        account: 'accountId'
      }
    ]

    const recurrences = [
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: oldTransactions,
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: {
          deltas: { sigma: 1.5, mean: 29.5, median: 29.5, mad: 1.5 }
        },
        accounts: ['accountId']
      }
    ]

    const newTransaction = [
      {
        _id: 'april',
        amount: -50,
        date: '2021-04-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'otherAccountId'
      }
    ]

    const expectedBundles = recurrences

    const newBundles = findAndUpdateRecurrences(recurrences, newTransaction)

    expect(newBundles).toMatchObject(expectedBundles)
  })

  it('should create new bundle if the transactions do not correspond to an existing bundle', () => {
    const oldTransactions = [
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
        account: 'accountId'
      }
    ]

    const recurrences = [
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: oldTransactions,
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: {
          deltas: { sigma: 1.5, mean: 29.5, median: 29.5, mad: 1.5 }
        },
        accounts: ['accountId']
      }
    ]

    const transactions = [
      {
        _id: 'april',
        amount: 2000,
        date: '2021-04-01T12:00:00.000Z',
        label: 'Mon Salaire Mai',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'may',
        amount: 2000,
        date: '2021-05-01T12:00:00.000Z',
        label: 'Mon Salaire Juin',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'june',
        amount: 2000,
        date: '2021-06-01T12:00:00.000Z',
        label: 'Mon Salaire Juillet',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      }
    ]

    const expectedBundles = [
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: oldTransactions,
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: { deltas: { sigma: 1.5, mean: 29.5, median: 29.5, mad: 1.5 } },
        accounts: ['accountId']
      },
      {
        categoryIds: ['SalaireId'],
        amounts: [2000],
        ops: transactions,
        automaticLabel: 'Mon Salaire Mai',
        brand: null,
        stats: { deltas: { sigma: 0.5, mean: 30.5, median: 30.5, mad: 0.5 } }
      }
    ]

    const bundles = findAndUpdateRecurrences(recurrences, transactions)

    expect(bundles).toMatchObject(expectedBundles)
  })

  it('should update existing bundle and create a new one', () => {
    const oldTransactions = [
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
        account: 'accountId'
      }
    ]

    const recurrences = [
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: oldTransactions,
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: {
          deltas: { sigma: 1.5, mean: 29.5, median: 29.5, mad: 1.5 }
        },
        accounts: ['accountId']
      }
    ]

    const newNetflixTransactions = [
      {
        _id: 'aprilNetflix',
        amount: -50,
        date: '2021-04-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'mayNetflix',
        amount: -50,
        date: '2021-05-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'juneNetflix',
        amount: -50,
        date: '2021-06-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'accountId'
      }
    ]

    const newSalaireTransactions = [
      {
        _id: 'aprilSalaire',
        amount: 2000,
        date: '2021-04-01T12:00:00.000Z',
        label: 'Mon Salaire Mai',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'maySalaire',
        amount: 2000,
        date: '2021-05-01T12:00:00.000Z',
        label: 'Mon Salaire Juin',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'juneSalaire',
        amount: 2000,
        date: '2021-06-01T12:00:00.000Z',
        label: 'Mon Salaire Juillet',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      }
    ]

    const transactions = [...newNetflixTransactions, ...newSalaireTransactions]

    const expectedBundles = [
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: [...oldTransactions, ...newNetflixTransactions],
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: {
          deltas: { sigma: 1.1661903789690757, mean: 30.2, median: 31, mad: 0 }
        },
        accounts: ['accountId']
      },
      {
        categoryIds: ['SalaireId'],
        amounts: [2000],
        ops: newSalaireTransactions,
        automaticLabel: 'Mon Salaire Mai',
        brand: null,
        stats: { deltas: { sigma: 0.5, mean: 30.5, median: 30.5, mad: 0.5 } }
      }
    ]

    const bundles = findAndUpdateRecurrences(recurrences, transactions)

    expect(bundles).toMatchObject(expectedBundles)
  })

  it('should update existing multiple bundles', () => {
    const oldNetflixTransactions = [
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
        account: 'accountId'
      }
    ]

    const oldSalaireTransactions = [
      {
        _id: 'janSalaire',
        amount: 2000,
        date: '2021-01-01T12:00:00.000Z',
        label: 'Mon Salaire Janvier',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'febSalaire',
        amount: 2000,
        date: '2021-02-01T12:00:00.000Z',
        label: 'Mon Salaire Février',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'marchSalaire',
        amount: 2000,
        date: '2021-03-01T12:00:00.000Z',
        label: 'Mon Salaire Mars',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      }
    ]

    const recurrences = [
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: oldNetflixTransactions,
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: {
          deltas: { sigma: 1.1661903789690757, mean: 30.2, median: 31, mad: 0 }
        },
        accounts: ['accountId']
      },
      {
        categoryIds: ['SalaireId'],
        amounts: [2000],
        ops: oldSalaireTransactions,
        automaticLabel: 'Mon Salaire Mars',
        brand: null,
        stats: { deltas: { sigma: 0.5, mean: 30.5, median: 30.5, mad: 0.5 } },
        accounts: ['accountId']
      }
    ]

    const newNetflixTransactions = [
      {
        _id: 'aprilNetflix',
        amount: -50,
        date: '2021-04-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'mayNetflix',
        amount: -50,
        date: '2021-05-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'juneNetflix',
        amount: -50,
        date: '2021-06-01T12:00:00.000Z',
        label: 'Netflix',
        automaticCategoryId: 'NetflixId',
        localCategoryId: '0',
        account: 'accountId'
      }
    ]

    const newSalaireTransactions = [
      {
        _id: 'aprilSalaire',
        amount: 2000,
        date: '2021-04-01T12:00:00.000Z',
        label: 'Mon Salaire Mai',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'maySalaire',
        amount: 2000,
        date: '2021-05-01T12:00:00.000Z',
        label: 'Mon Salaire Juin',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      },
      {
        _id: 'juneSalaire',
        amount: 2000,
        date: '2021-06-01T12:00:00.000Z',
        label: 'Mon Salaire Juillet',
        automaticCategoryId: 'SalaireId',
        localCategoryId: '0',
        account: 'accountId'
      }
    ]

    const transactions = [
      ...newNetflixTransactions,
      ...newSalaireTransactions,
      {
        _id: 'other',
        amount: 100,
        date: '2021-04-01T12:00:00.000Z',
        label: 'Autre',
        automaticCategoryId: 'OtherId',
        localCategoryId: '0',
        account: 'accountId'
      }
    ]

    const expectedBundles = [
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: [...oldNetflixTransactions, ...newNetflixTransactions],
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: {
          deltas: { sigma: 1.1661903789690757, mean: 30.2, median: 31, mad: 0 }
        },
        accounts: ['accountId']
      },
      {
        categoryIds: ['SalaireId'],
        amounts: [2000],
        ops: [...oldSalaireTransactions, ...newSalaireTransactions],
        automaticLabel: 'Mon Salaire Mars',
        brand: null,
        stats: {
          deltas: { sigma: 1.1661903789690757, mean: 30.2, median: 31, mad: 0 }
        }
      }
    ]

    const bundles = findAndUpdateRecurrences(recurrences, transactions)

    expect(bundles).toMatchObject(expectedBundles)
  })

  it('should update existing bundles', () => {
    const transactions = fixtures[TRANSACTION_DOCTYPE].filter(
      tr => tr.date < '2019-05'
    )
    const recurrences = findAndUpdateRecurrences([], transactions)
    recurrences.forEach(assertValidRecurrence)

    expect(
      '\n' + sortBy(recurrences.map(formatRecurrence)).join('\n')
    ).toMatchSnapshot()

    const newTransactions = fixtures[TRANSACTION_DOCTYPE].filter(
      tr => tr.date > '2019-05'
    )
    const updatedRecurrences = findAndUpdateRecurrences(
      recurrences,
      newTransactions
    )
    updatedRecurrences.forEach(assertValidRecurrence)

    expect(
      '\n' + sortBy(updatedRecurrences.map(formatRecurrence)).join('\n')
    ).toMatchSnapshot()
  })

  it('should update existing bundle, even for more than 100 days back', () => {
    const oldNetflixTransactions = [
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
        account: 'accountId'
      }
    ]

    const recurrences = [
      {
        categoryIds: ['NetflixId'],
        amounts: [-50],
        ops: oldNetflixTransactions,
        automaticLabel: 'Netflix',
        brand: 'Netflix',
        stats: {
          deltas: { sigma: 1.1661903789690757, mean: 30.2, median: 31, mad: 0 }
        },
        accounts: ['accountId']
      }
    ]

    const transactions = fixtures[TRANSACTION_DOCTYPE]
    const spyUpdate = jest.spyOn(utils, 'addTransactionToBundles')

    findAndUpdateRecurrences(recurrences, transactions)
    expect(spyUpdate).toHaveBeenCalled()
  })
})

describe('recurrence scenario with multiple amounts and categories', () => {
  const transactionsByKey = keyBy(fixtures5[TRANSACTION_DOCTYPE], '_id')
  const transactions = [
    transactionsByKey['february'],
    transactionsByKey['march'],
    transactionsByKey['april']
  ]

  const mayTransaction = transactionsByKey['may']
  const juneTransaction = transactionsByKey['june']

  const recurrence = {
    brand: '',
    categoryIds: ['0', '200110'],
    amounts: [2000, 2150],
    accounts: ['1d22740c6c510e5368d1b6b670deee05'],
    ops: [...transactions, mayTransaction],
    automaticLabel: 'Mon Salaire'
  }

  it('should reattach new operations to the current recurrence, in the event that the amount and category of the new transaction is different from the previous one', () => {
    juneTransaction.amount = 2000
    juneTransaction.automaticCategoryId = '0'

    const bundleWithJune = findAndUpdateRecurrences(
      [recurrence],
      [juneTransaction]
    )

    const bundle = bundleWithJune[0]
    const [op1, op2, op3, op4, op5] = bundle.ops

    expect(bundleWithJune.length).toBe(1)
    expect(bundle.categoryIds).toMatchObject(['0', '200110'])
    expect(bundle.amounts).toMatchObject([2000, 2150])
    expect(bundle.ops.length).toBe(5)
    expect(op1).toMatchObject({ _id: 'february', amount: 2000 })
    expect(op2).toMatchObject({ _id: 'march', amount: 2000 })
    expect(op3).toMatchObject({ _id: 'april', amount: 2000 })
    expect(op4).toMatchObject({ _id: 'may', amount: 2150 })
    expect(op5).toMatchObject({ _id: 'june', amount: 2000 })
  })

  it('should reattach new operations to the current recurrence, in the event that the amount and category of the new transaction is the sme from the previous one and with same category', () => {
    juneTransaction.amount = 2000
    juneTransaction.automaticCategoryId = '200110'

    const bundleWithJune = findAndUpdateRecurrences(
      [recurrence],
      [juneTransaction]
    )

    const bundle = bundleWithJune[0]
    const [op1, op2, op3, op4, op5] = bundle.ops

    expect(bundleWithJune.length).toBe(1)
    expect(bundle.categoryIds).toMatchObject(['0', '200110'])
    expect(bundle.amounts.length).toBe(2)
    expect(bundle.amounts).toMatchObject([2000, 2150])
    expect(bundle.ops.length).toBe(5)
    expect(op1).toMatchObject({ _id: 'february', amount: 2000 })
    expect(op2).toMatchObject({ _id: 'march', amount: 2000 })
    expect(op3).toMatchObject({ _id: 'april', amount: 2000 })
    expect(op4).toMatchObject({ _id: 'may', amount: 2150 })
    expect(op5).toMatchObject({ _id: 'june', amount: 2000 })
  })

  it('reattach next new operations from a new bundle which has 1 operation with "very month" in frequency', () => {
    const transactionsByKey = keyBy(fixtures6[TRANSACTION_DOCTYPE], '_id')
    const febTransactionEDF = transactionsByKey['february']
    const mayTransactionEDF = transactionsByKey['may']

    const recurrence = {
      categoryIds: ['401080'],
      amounts: [30],
      accounts: ['1d22740c6c510e5368d1b6b670deee05'],
      ops: [febTransactionEDF],
      automaticLabel: 'EDF'
    }

    const bundleWithEDF = findAndUpdateRecurrences(
      [recurrence],
      [mayTransactionEDF]
    )

    const bundle = bundleWithEDF[0]
    expect(bundle.ops.length).toBe(2)

    const t = getT(enLocaleOption)
    expect(getFrequencyText(t, bundle)).toBe('every month')

    const [op1, op2] = bundle.ops

    expect(op1).toMatchObject({ _id: 'february', amount: 30 })
    expect(op2).toMatchObject({ _id: 'may', amount: 30 })
  })
})
