import { Q } from 'cozy-client'
import { BankTransaction } from 'cozy-doctypes'
import flag from 'cozy-flags'
import chunk from 'lodash/chunk'
import sortBy from 'lodash/sortBy'
import { differenceInSeconds } from 'date-fns'
import { TRANSACTION_DOCTYPE } from 'doctypes'

// Each chunk will contain 100 transactions
export const CHUNK_SIZE = 100

const MAX_EXECUTION_TIME = parseInt(process.env.COZY_TIME_LIMIT, 10)
const timeStart = new Date()
let highestTime = 0

/**
 * Fetch all transactions marked as `toCategorize` by a banking konnector
 *
 * @return {Promise} Promise that resolves with an array of io.cozy.bank.operations documents
 */
export const fetchTransactionsToCategorize = async client => {
  const transactions = await client.queryAll(
    Q(TRANSACTION_DOCTYPE).where({ toCategorize: true })
  )
  return transactions
}

/**
 * Fetch transactions to categorize and chunk them
 *
 * @return {io.cozy.bank.operations[][]} The chunks to categorize
 */
export const fetchChunksToCategorize = async client => {
  const toCategorize = await fetchTransactionsToCategorize(client)
  const sortedToCategorize = sortBy(toCategorize, t => t.date).reverse()
  const chunks = chunk(sortedToCategorize, CHUNK_SIZE)

  return chunks
}

/**
 * Apply global and local categorization models to a chunk
 *
 * @param {Object} categorizer - A categorizer (see https://docs.cozy.io/en/cozy-konnector-libs/api/#categorization)
 * @param {io.cozy.bank.operations[]} chunk - Operations to categorize
 *
 * @return {Number} the time taken to categorize the chunk
 */
export const categorizeChunk = async (categorizer, chunk) => {
  const timeStart = new Date()
  const categorizedTransactions = categorizer.categorize(chunk)
  categorizedTransactions.forEach(t => (t.toCategorize = false))

  await BankTransaction.bulkSave(categorizedTransactions, { concurrency: 30 })

  const timeEnd = new Date()
  const timeElapsed = differenceInSeconds(timeEnd, timeStart)

  return timeElapsed
}

/**
 * Set the highest time taken to categorize a chunk
 * This value is used to check if there is enough time left to categorize
 * another chunk
 *
 * @param {number} time - The time to compare and save if needed
 */
export const updateTimeTracking = time => {
  highestTime = Math.max(highestTime, time)
}

/**
 * Tell if there is enough time left to categorize the next chunk or not
 *
 * @return {boolean}
 */
export const canCategorizeNextChunk = () => {
  const executionTime = differenceInSeconds(new Date(), timeStart)
  const nextExecutionTime = executionTime + highestTime

  return nextExecutionTime < MAX_EXECUTION_TIME
}

/**
 * Ask the stack to start a banks' service
 *
 * @param {string} name - The name of the service to start
 *
 * @return {Promise}
 */
export const startService = (client, name) => {
  const args = {
    name,
    slug: flag('banking.banking-app-slug') || 'banks'
  }
  const jobCollection = client.collection('io.cozy.jobs')
  return jobCollection.create('service', args)
}
