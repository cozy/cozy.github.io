import startCase from 'lodash/startCase'
import maxBy from 'lodash/maxBy'
import groupBy from 'lodash/groupBy'
import { getLabel as getTransactionLabel } from 'ducks/transactions/helpers'
import { getCategoryId } from 'ducks/categories/helpers'

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
  return bundle.categoryId.split(' / ')
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
  const frequency = getFrequency(recurrence)
  const freqWord = getFrequencyWord(frequency)
  const text = freqWord
    ? t(`Recurrence.transaction.freq-info-word.${freqWord}`)
    : t(`Recurrence.transaction.freq-info`, { frequency })
  return text
}

export const getAmount = bundle => {
  const amount = bundle.amount.split(' / ')
  return amount[0]
}

export const getCurrency = () => {
  return '€'
}

export const makeRecurrenceFromTransaction = transaction => {
  return {
    _type: RECURRENCE_DOCTYPE,
    automaticLabel: getTransactionLabel(transaction),
    stats: {
      deltas: {
        median: 30
      }
    },
    amount: transaction.amount,
    categoryId: getCategoryId(transaction)
  }
}
