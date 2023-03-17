import { Q } from 'cozy-client'
import { format } from '@fast-csv/format'
import formatDate from 'date-fns/format'

import { ACCOUNT_DOCTYPE, TRANSACTION_DOCTYPE } from 'doctypes'
import { getCategoryId, getApplicationDate } from 'ducks/transactions/helpers'
import { getCategoryName } from 'ducks/categories/categoriesMap'
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
 * Fetch all accounts and keep only those not associated with the given
 * transactions.
 *
 * @param {CozyClient} client A CozyClient instance
 * @param {object} options
 * @param {Array<BankTransaction>} options.transactions Transactions used to filter accounts
 *
 * @return {Promise<Array<BankAccount>>} Promise that resolves with an array of io.cozy.bank.operations documents
 */
export const fetchAccountsToExport = async (client, { transactions }) => {
  const accounts = await client.queryAll(Q(ACCOUNT_DOCTYPE).limitBy(1000))

  return accounts.filter(
    account =>
      !transactions.some(
        transaction => transaction.account?.data?._id === account._id
      )
  )
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
      'Expected?',
      'Expected debit date',
      'Reimbursement status',
      'Bank name',
      'Account name',
      'Custom account name',
      'Account number',
      'Account originalNumber',
      'Account type',
      'Account balance',
      'Account coming balance',
      'Account IBAN',
      'Account vendorDeleted',
      'Recurrent?',
      'Recurrence name',
      'Recurrence status',
      'Recurrence frequency',
      'Tag 1',
      'Tag 2',
      'Tag 3',
      'Tag 4',
      'Tag 5',
      'Unique ID',
      'Unique account ID',
      'Loan amount',
      'Interest rate',
      'Next payment date',
      'Next payment amount',
      'Subscription date',
      'Repayment date'
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
    const categoryId = getCategoryId(transaction)

    const data = [
      dateStr(transaction.date),
      dateStr(transaction.realisationDate),
      dateStr(getApplicationDate(transaction)),
      transaction.label,
      transaction.originalBankLabel,
      getCategoryName(categoryId),
      transaction.amount,
      transaction.currency,
      transaction.type,
      transaction.isComing ? 'yes' : 'no',
      dateStr(transaction.valueDate),
      transaction.reimbursementStatus
    ]

    // Transaction's bank account information
    data.push(
      account?.institutionLabel,
      account?.label,
      account?.shortLabel,
      account?.number,
      account?.originalNumber,
      account?.type,
      account?.balance,
      account?.comingBalance,
      account?.iban,
      account?.vendorDeleted
    )

    // Transaction's recurrence information
    data.push(
      recurrence != null
        ? 'yes'
        : transaction.relationships?.recurrence?.data?._id === 'not-recurrent'
        ? 'no'
        : undefined,
      recurrence?.manualLabel || recurrence?.automaticLabel,
      recurrence?.status,
      recurrence?.stats?.deltas?.median
    )

    // Transaction's tags information
    for (let i = 0; i < 5; i++) {
      if (tags?.[i] != null) {
        data.push(tags[i].label)
      } else {
        data.push(undefined)
      }
    }

    // Unique identifiers
    data.push(
      transaction.vendorId || transaction.linxoId,
      account?.vendorId || account?.linxoId
    )

    // Loan data
    data.push(undefined, undefined, undefined, undefined, undefined, undefined)

    yield data
  }
}

/**
 * Generator that transforms the given accounts into our own CSV format and yields the result line by line.
 *
 * @param {Array<BankAccount>} accounts The list of accounts to transform
 *
 * @return {IterableIterator<Array<string|undefined>>}
 */
export const accountsWitoutTransactionsToCSV = function* (accounts) {
  for (const account of accounts) {
    // Transaction information
    const data = [
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    ]

    // Account information
    data.push(
      account.institutionLabel,
      account.label,
      account.shortLabel,
      account.number,
      account.originalNumber,
      account.type,
      account.balance,
      account.comingBalance,
      account.iban,
      account.vendorDeleted
    )

    // Recurrence information
    data.push(undefined, undefined, undefined, undefined)

    // Tags information
    data.push(undefined, undefined, undefined, undefined, undefined)

    // Unique identifiers
    data.push(undefined, account.vendorId || account.linxoId)

    // Loan data
    data.push(
      account.loan?.totalAmount,
      account.loan?.rate,
      dateStr(account.loan?.nextPaymentDate),
      account.loan?.nextPaymentAmount,
      dateStr(account.loan?.subscriptionDate),
      dateStr(account.loan?.maturityDate)
    )

    yield data
  }
}
