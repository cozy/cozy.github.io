import { runService } from './service'
import logger from 'cozy-logger'

const log = logger.namespace('recurrence')
// import runRecurrenceService from 'ducks/recurrence/service'

runService(async (/* { client }*/) => {
  // FIXME: Find out why this service loops (i.e. modifies transactions which
  // re-triggers it).
  log(
    'debug',
    'Not running the service as it keeps modifying transactions triggering further service calls'
  )
  // await runRecurrenceService({ client })
})
