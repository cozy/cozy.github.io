/* global __TARGET__ */

import { cozyClient } from 'cozy-konnector-libs'
import { BankTransaction } from 'cozy-doctypes'
import { sortBy, chunk } from 'lodash'
import { differenceInSeconds } from 'date-fns'
import { getTracker } from 'ducks/tracking'
import { LOCAL_MODEL_USAGE_THRESHOLD } from 'ducks/categories/helpers'

BankTransaction.registerClient(cozyClient)

// Each chunk will contain 100 transactions
export const CHUNK_SIZE = 100

const MAX_EXECUTION_TIME = 200
const timeStart = new Date()
let highestTime = 0

export const fetchTransactionsToCategorize = () => {
  return BankTransaction.queryAll({
    toCategorize: true
  })
}

export const fetchChunksToCategorize = async () => {
  const toCategorize = await fetchTransactionsToCategorize()
  const sortedToCategorize = sortBy(toCategorize, t => t.date).reverse()
  const chunks = chunk(sortedToCategorize, CHUNK_SIZE)

  return chunks
}

export const categorizeChunk = async (categorizer, chunk) => {
  const timeStart = new Date()
  const categorizedTransactions = categorizer.categorize(chunk)
  categorizedTransactions.forEach(t => (t.toCategorize = false))

  await BankTransaction.bulkSave(categorizedTransactions, 30)

  sendResultsToMatomo(categorizedTransactions)

  const timeEnd = new Date()
  const timeElapsed = differenceInSeconds(timeEnd, timeStart)

  return timeElapsed
}

export const sendResultsToMatomo = transactions => {
  const tracker = getTracker(__TARGET__, { e_a: 'LocalCategorization' })
  const nbTransactionsAboveThreshold = transactions.reduce(
    (sum, transaction) => {
      if (transaction.localCategoryProba > LOCAL_MODEL_USAGE_THRESHOLD) {
        return sum + 1
      }

      return sum
    },
    0
  )

  tracker.trackEvent({
    e_n: 'TransactionsUsingLocalCategory',
    e_v: nbTransactionsAboveThreshold
  })
}

export const updateTimeTracking = time => {
  highestTime = Math.max(highestTime, time)
}

export const canCategorizeNextChunk = () => {
  const executionTime = differenceInSeconds(new Date(), timeStart)
  const nextExecutionTime = executionTime + highestTime

  return nextExecutionTime < MAX_EXECUTION_TIME
}

export const startService = name => {
  const args = {
    message: {
      name,
      slug: 'banks'
    }
  }

  return cozyClient.jobs.create('service', args)
}
