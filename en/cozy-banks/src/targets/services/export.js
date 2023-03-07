import stream from 'stream'
import flag from 'cozy-flags'
import { uploadFileWithConflictStrategy } from 'cozy-client/dist/models/file'

import {
  accountsWitoutTransactionsToCSV,
  createFormatStream,
  fetchAccountsToExport,
  fetchTransactionsToExport,
  transactionsToCSV
} from 'ducks/export/services'
import logger from 'ducks/export/logger'
import { DATA_EXPORT_DIR_ID, DATA_EXPORT_NAME } from 'ducks/export/constants'
import { runService } from './service'

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

  logger('info', 'Fetching accounts without transactions...')
  const accounts = await fetchAccountsToExport(client, { transactions })
  logger('info', `Fetched ${accounts.length} accounts`)

  if (transactions.length === 0 && accounts.length === 0) {
    logger('info', 'No data to export')
    return
  }

  logger('info', `Creating streams...`)
  const csv = createFormatStream()
  const accountsStream = stream.Readable.from(
    accountsWitoutTransactionsToCSV(accounts)
  )
  const transactionsStream = stream.Readable.from(
    transactionsToCSV(transactions)
  )

  accountsStream.on('end', () => {
    logger('info', `Transforming transactions to CSV...`)
    transactionsStream.pipe(csv)
  })

  logger('info', `Transforming accounts to CSV...`)
  accountsStream.pipe(csv, { end: false })

  logger('info', `Starting CSV file upload to Cozy...`)
  await uploadFileWithConflictStrategy(client, csv, {
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
