import startCase from 'lodash/startCase'
import maxBy from 'lodash/maxBy'
import groupBy from 'lodash/groupBy'
import {
  getCategoryId,
  getLabel as getTransactionLabel
} from 'ducks/transactions/helpers'
import addDays from 'date-fns/add_days'
import parse from 'date-fns/parse'

const RECURRENCE_DOCTYPE = 'io.cozy.bank.recurrence'

export const prettyLabel = label => {
  return label ? startCase(label.toLowerCase()) : ''
}

const mostFrequent = (iterable, fn) => {
  const groups = groupBy(iterable, fn)
  return maxBy(Object.entries(groups), ([, ops]) => ops.length)[0]
}

export const getAutomaticLabelFromBundle = bundle =>
  mostFrequent(bundle.ops, op => op.label)

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
    accounts: [accountId],
    amounts: [transaction.amount],
    categoryIds: [getCategoryId(transaction)]
  }
}

/** Gives the next date for a recurrence, based on the median stat and the latest date */
export const nextDate = recurrence => {
  try {
    const {
      latestDate,
      stats: {
        deltas: { median }
      }
    } = recurrence
    const date = parse(latestDate)
    return addDays(date, median)
  } catch {
    return null
  }
}
