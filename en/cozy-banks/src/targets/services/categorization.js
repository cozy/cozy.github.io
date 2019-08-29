import logger from 'cozy-logger'
import { createCategorizer } from 'cozy-konnector-libs'
import {
  fetchChunksToCategorize,
  canCategorizeNextChunk,
  categorizeChunk,
  updateTimeTracking,
  CHUNK_SIZE,
  startService
} from 'ducks/categorization/services'

const log = logger.namespace('service/categorization')

const categorization = async () => {
  log('info', 'Fetching chunks to categorize...')
  let chunks

  try {
    chunks = await fetchChunksToCategorize()
  } catch (err) {
    log('error', 'Error while fetching chunks to categorize ' + err)
    return
  }

  log(
    'info',
    `${chunks.length} chunks of ${CHUNK_SIZE} transactions to categorize`
  )

  log('info', 'Creating a new categorizer...')
  const categorizer = await createCategorizer()

  log('info', 'Categorizing chunks...')
  for (const chunk of chunks) {
    if (canCategorizeNextChunk()) {
      log('info', 'Categorizing chunk...')

      try {
        const timeElapsed = await categorizeChunk(categorizer, chunk)
        log('info', `Last chunk was categorized in ${timeElapsed}s`)

        updateTimeTracking(timeElapsed)
      } catch (e) {
        log('error', 'Error while categorizing transactions ' + e)
      }
    } else {
      log(
        'info',
        'Not enough time remaining to categorize next chunk, starting a new service run.'
      )
      await startService('categorization')
      return
    }
  }

  log('info', 'All transactions have been successfuly categorized.')

  log('info', 'Starting onOperationOrBillCreate service...')
  await startService('onOperationOrBillCreate')
}

categorization()
