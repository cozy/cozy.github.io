import stream from 'stream'
import util from 'util'
import flag from 'cozy-flags'

import {
  fetchContentToImport,
  fetchExistingAccounts,
  fetchExistingRecurrences,
  fetchExistingTags,
  fetchExistingTransactions,
  saveSuccessData
} from 'ducks/import/queries'
import {
  createParseStream,
  saveMissingAccounts,
  saveMissingRecurrences,
  saveMissingTags,
  saveMissingTransactions,
  updateTagsRelationships
} from 'ducks/import/services'
import logger from 'ducks/export/logger'
import { runService } from './service'

const pipeline = util.promisify(stream.pipeline)

const main = async ({ client }) => {
  if (require.main !== module && process.env.NODE_ENV !== 'production') {
    client.registerPlugin(flag.plugin)
    await client.plugins.flags.refresh()
  }
  if (!flag('banks.services.export.enabled')) {
    logger(
      'info',
      'Bailing out of import service since flag "banks.services.export.enabled" is not set to `true`'
    )
    return
  }

  const { fileId } = JSON.parse(process.env.COZY_FIELDS)

  logger('info', `Fetching content of file \`${fileId}\`...`)
  const resp = await fetchContentToImport(client, fileId)

  if (resp.status === 404) {
    throw new Error('Missing file to import')
  }

  // Transform the transactions into a CSV file
  logger('info', `Creating transformation stream...`)
  const accountsById = {}
  const transactionsById = {}
  const recurrencesById = {}
  const tagsById = {}
  const parse = createParseStream({
    accountsById,
    recurrencesById,
    tagsById,
    transactionsById
  })

  logger('info', `Transforming CSV to data...`)
  await pipeline(resp.body, parse)

  logger('info', `Importing accounts...`)
  const existingAccounts = await fetchExistingAccounts(client)
  const existingAccountsById = await saveMissingAccounts(client, accountsById, {
    existingAccounts
  })

  logger('info', `Importing recurrences...`)
  const existingRecurrences = await fetchExistingRecurrences(client)
  const existingRecurrencesById = await saveMissingRecurrences(
    client,
    recurrencesById,
    {
      existingAccountsById,
      existingRecurrences
    }
  )

  logger('info', `Importing tags...`)
  const existingTags = await fetchExistingTags(client)
  const existingTagsById = await saveMissingTags(client, tagsById, {
    existingTags
  })

  logger('info', `Importing transactions...`)
  const existingTransactions = await fetchExistingTransactions(client)
  const { existingTransactionsById, savedTransactions } =
    await saveMissingTransactions(client, transactionsById, {
      existingAccountsById,
      existingRecurrencesById,
      existingTransactions
    })

  logger('info', `Creating transactions-tags relationships...`)
  await updateTagsRelationships(client, transactionsById, {
    existingTagsById,
    existingTransactionsById
  })

  logger('info', `Saving import success data`)
  await saveSuccessData(client, { savedTransactions })

  logger(
    'info',
    `Successfully imported ${savedTransactions.length} transactions`
  )
}

if (require.main === module || process.env.NODE_ENV === 'production') {
  runService(main)
}

export default main
