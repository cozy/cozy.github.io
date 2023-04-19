import { Q } from 'cozy-client'

import {
  ACCOUNT_DOCTYPE,
  FILES_DOCTYPE,
  RECURRENCE_DOCTYPE,
  TAGS_DOCTYPE,
  TRANSACTION_DOCTYPE,
  settingsConn
} from 'doctypes'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'

export const fetchContentToImport = async (client, fileId) => {
  return client.collection(FILES_DOCTYPE).fetchFileContentById(fileId)
}

/**
 * Fetch all transactions and associated data.
 *
 * @param {CozyClient} client A CozyClient instance
 *
 * @return {Promise<Array<BankTransaction>>} Promise that resolves with an array of io.cozy.bank.operations documents
 */
export const fetchExistingTransactions = async client => {
  const transactions = await client.queryAll(
    Q(TRANSACTION_DOCTYPE)
      .include(['account', 'recurrence', 'tags'])
      .limitBy(1000)
  )
  return client.hydrateDocuments(TRANSACTION_DOCTYPE, transactions)
}

export const fetchExistingAccounts = async client => {
  return client.queryAll(Q(ACCOUNT_DOCTYPE).limitBy(1000))
}

export const fetchExistingRecurrences = async client => {
  return client.queryAll(Q(RECURRENCE_DOCTYPE).limitBy(1000))
}

export const fetchExistingTags = async client => {
  return client.queryAll(Q(TAGS_DOCTYPE).limitBy(1000))
}

export const saveAll = async (client, docs) => {
  if (docs.length > 0) {
    const { data } = await client.saveAll(docs)
    return data
  }
  return []
}

export const saveSuccessData = async (client, { savedTransactions }) => {
  const { query, ...options } = settingsConn
  const settingsCollection = await client.query(query(), options)
  const settings = getDefaultedSettingsFromCollection(settingsCollection)

  await client.save({
    ...settings,
    lastImportSuccess: {
      savedTransactionsCount: savedTransactions.length
    }
  })
}
