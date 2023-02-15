import uniqBy from 'lodash/uniqBy'
import startCase from 'lodash/startCase'
import min from 'lodash/min'
import max from 'lodash/max'
import addDays from 'date-fns/add_days'
import parse from 'date-fns/parse'
import differenceInDays from 'date-fns/difference_in_days'

import flag from 'cozy-flags'

import { PERCENTAGE_AMOUNTS_ACCEPTED } from 'ducks/recurrence/constants'

import {
  getCategoryId,
  getLabel as getTransactionLabel
} from 'ducks/transactions/helpers'
import { logRecurrencesLabelAndTransactionsNumber } from 'ducks/recurrence/service'

const RECURRENCE_DOCTYPE = 'io.cozy.bank.recurrence'

export const prettyLabel = label => {
  return label ? startCase(label.toLowerCase()) : ''
}

export const getLabel = bundle => {
  if (bundle.manualLabel) {
    return bundle.manualLabel
  } else {
    return prettyLabel(bundle.automaticLabel)
  }
}

export const getCategories = bundle => {
  return bundle.categoryIds
}

export const getFrequencyWord = freq => {
  if (freq > 5 && freq <= 8) {
    return 'weekly'
  } else if (freq > 26 && freq <= 40) {
    return 'monthly'
  } else if (freq > 300 && freq <= 400) {
    return 'yearly'
  }
}

export const getFrequency = recurrence => {
  return recurrence.stats.deltas.median
}

export const getFrequencyText = (t, recurrence) => {
  const frequency = Math.floor(getFrequency(recurrence))
  const freqWord = getFrequencyWord(frequency)
  const text = freqWord
    ? t(`Recurrence.freq-info-word.${freqWord}`)
    : t(`Recurrence.freq-info`, { frequency })
  return text
}

export const getAmount = bundle => {
  return bundle.amounts[0]
}

export const getCurrency = () => {
  return '€'
}

const PERCENTAGE =
  Number(flag('banks.recurrency.percentage-amounts-accepted')) ||
  PERCENTAGE_AMOUNTS_ACCEPTED

export const getMinAmount = bundle => {
  const minAmount = Math.abs(min(bundle.amounts))
  return minAmount - minAmount * PERCENTAGE
}

export const getMaxAmount = bundle => {
  const maxAmount = Math.abs(max(bundle.amounts))
  return maxAmount + maxAmount * PERCENTAGE
}

export const isBetween = ({ value, min, max }) => min <= value && value <= max

/**
 * Make a recurrence from a transaction. The recurrence will inherit
 * the amount / account / category of the transaction
 *
 * @param  {Transaction} transaction (not hydrated)
 * @return {Recurrence}
 */
export const makeRecurrenceFromTransaction = transaction => {
  const accountId = transaction.account
  return {
    _type: RECURRENCE_DOCTYPE,
    automaticLabel: getTransactionLabel(transaction),
    stats: {
      deltas: {
        median: 30
      }
    },
    latestDate: transaction.date,
    latestAmount: transaction.amount,
    accounts: [accountId],
    amounts: [transaction.amount],
    categoryIds: [getCategoryId(transaction)]
  }
}

/** Gives the next date for a recurrence, based on the median stat and the latest date */
export const nextDate = recurrence => {
  try {
    const {
      latestDate: rawLatestDate,
      stats: {
        deltas: { median }
      }
    } = recurrence
    const latestDate = parse(rawLatestDate)
    const now = new Date(Date.now())
    const deltaDays = differenceInDays(now, latestDate)
    const n = deltaDays / median
    const r = Math.ceil(n)
    const candidate = addDays(latestDate, r * median)
    if (differenceInDays(candidate, now) <= 0) {
      return new Date(now)
    }
    return candidate
  } catch (e) {
    // eslint-disable-next-line
    console.error('Error while computing next date', e)
    return null
  }
}

export const isDeprecatedBundle = recurrence => {
  const latestDate = parse(recurrence.latestDate)
  const now = Date.now()
  return differenceInDays(now, latestDate)
}

/**
 * Adds new transactions to bundles which match with these conditions:
 * - Amount (with +/- percentage)
 * - CategoryId
 * - Account
 *
 * @param {Array<Recurrence>} bundles
 * @param {Array<Transaction>} newTransactions
 *
 * @returns {{transactionsForUpdatedBundles: Array<Transaction>, updatedBundles: Array<Recurrence>}}
 */
export const addTransactionsToBundles = (bundles, newTransactions) => {
  let transactionsForUpdatedBundles = []

  const updatedBundles = [...bundles].map(b => {
    const bundle = { ...b } // WARNING: this only creates a shallow copy of `b`

    const minAmount = getMinAmount(bundle)
    const maxAmount = getMaxAmount(bundle)

    const transactionsFound = newTransactions.filter(transaction => {
      const hasSomeSameCategoryId = bundle.categoryIds.some(
        catId => getCategoryId(transaction) === catId
      )

      const hasAmountsBetweenExtremum = isBetween({
        value: Math.abs(transaction.amount),
        min: minAmount,
        max: maxAmount
      })

      const hasSomeSameAccount = bundle.accounts?.some(
        account => account === transaction.account
      )

      return (
        hasSomeSameCategoryId && hasAmountsBetweenExtremum && hasSomeSameAccount
      )
    })

    if (transactionsFound?.length > 0) {
      bundle.ops = uniqBy([...bundle.ops, ...transactionsFound], o => o._id)
      transactionsForUpdatedBundles =
        transactionsForUpdatedBundles.concat(transactionsFound)
    }

    return bundle
  })

  logRecurrencesLabelAndTransactionsNumber({
    prefix: `⭐ Updated: ${updatedBundles.length} existing bundles:`,
    recurrences: updatedBundles
  })

  return { updatedBundles, transactionsForUpdatedBundles }
}
