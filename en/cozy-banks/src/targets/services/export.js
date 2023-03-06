import stream from 'stream'
import util from 'util'
import flag from 'cozy-flags'
import { uploadFileWithConflictStrategy } from 'cozy-client/dist/models/file'

import {
  createFormatStream,
  fetchTransactionsToExport,
  transactionsToCSV
} from 'ducks/export/services'
import logger from 'ducks/export/logger'
import { DATA_EXPORT_DIR_ID, DATA_EXPORT_NAME } from 'ducks/export/constants'
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
      'Bailing out of export service since flag "banks.services.export.enabled" is not set to `true`'
    )
    return
  }

  logger('info', 'Fetching transactions...')
  const transactions = await fetchTransactionsToExport(client)
  logger('info', `Fetched ${transactions.length} transactions`)

  if (transactions.length === 0) {
    logger('info', 'No transactions to export')
    return
  }

  // Transform the transactions into a CSV file
  logger('info', `Creating transformation stream...`)
  const data = createFormatStream()
  logger('info', `Transforming data to CSV...`)
  pipeline(transactionsToCSV(transactions), data)

  // Upload the CSV file to the Cozy
  logger('info', `Uploading CSV file to Cozy...`)
  await uploadFileWithConflictStrategy(client, data, {
    name: DATA_EXPORT_NAME,
    dirId: DATA_EXPORT_DIR_ID,
    conflictStrategy: 'erase'
  })
  logger('info', `Export success`)
}

if (require.main === module || process.env.NODE_ENV === 'production') {
  runService(main)
}

export default main
