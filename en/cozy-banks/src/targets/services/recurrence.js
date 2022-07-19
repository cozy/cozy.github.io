import { runService } from './service'
import runRecurrenceService from 'ducks/recurrence/service'

runService(async ({ client }) => {
  await runRecurrenceService({ client })
})
