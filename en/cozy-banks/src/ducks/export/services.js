import { Q } from 'cozy-client'
import { format } from '@fast-csv/format'
import formatDate from 'date-fns/format'

import { TRANSACTION_DOCTYPE } from 'doctypes'
import categories from 'ducks/categories/tree'
import { DATE_FORMAT } from './constants'

const dateStr = date =>
  date != null ? formatDate(date, DATE_FORMAT) : undefined

/**
 * Fetch all transactions and associated data.
 *
 * @param {CozyClient} client A CozyClient instance
 *
 * @return {Promise<Array<BankTransaction>>} Promise that resolves with an array of io.cozy.bank.operations documents
 */
export const fetchTransactionsToExport = async client => {
  const transactions = await client.queryAll(
    Q(TRANSACTION_DOCTYPE)
      .include(['account', 'recurrence', 'tags'])
      .limitBy(1000)
  )
  return client.hydrateDocuments(TRANSACTION_DOCTYPE, transactions)
}

/**
 * Create a Transform Stream to transform input data into CSV lines.
 *
 * @return {TransformStream} The generated Transform Stream
 */
export const createFormatStream = () => {
  return format({
    delimiter: ';',
    quoteColumns: true,
    headers: [
      'Date',
      'Realisation date',
      'Assigned date',
      'Label',
      'Original bank label',
      'Category name',
      'Amount',
      'Currency',
      'Type',
      'Reimbursement status',
      'Bank name',
      'Account name',
      'Account number',
      'Account type',
      'Recurrence name',
      'Tag 1',
      'Tag 2',
      'Tag 3',
      'Tag 4',
      'Tag 5'
    ]
  })
}

/**
 * Generator that transforms the given transactions into our own CSV format and yields the result line by line.
 *
 * @param {Array<BankTransaction>} transactions The list of transactions to transform
 *
 * @return {IterableIterator<Array<string|undefined>>}
 */
export const transactionsToCSV = function* (transactions) {
  for (const transaction of transactions) {
    const account = transaction.account?.data
    const recurrence = transaction.recurrence?.data
    const tags = transaction.tags?.data

    const data = [
      dateStr(transaction.date),
      dateStr(transaction.realisationDate),
      dateStr(transaction.applicationDate),
      transaction.label,
      transaction.originalBankLabel,
      categories[transaction.cozyCategoryId],
      transaction.amount,
      transaction.currency,
      transaction.type,
      transaction.reimbursementStatus
    ]

    // Transaction's bank account information
    data.push(
      account?.institutionLabel,
      account?.label,
      account?.number,
      account?.type
    )

    // Transaction's recurrence information
    data.push(recurrence?.manualLabel || recurrence?.automaticLabel)

    // Transaction's tags information
    for (let i = 0; i < 5; i++) {
      if (tags?.[i] != null) {
        data.push(tags[i].label)
      } else {
        data.push(undefined)
      }
    }

    yield data
  }
}
