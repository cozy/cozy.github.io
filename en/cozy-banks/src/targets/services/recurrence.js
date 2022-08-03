import flag from 'cozy-flags'

import { logger } from 'ducks/konnectorAlerts'
import runRecurrenceService from 'ducks/recurrence/service'
import { runService } from './service'

runService(async ({ client }) => {
  client.registerPlugin(flag.plugin)
  await client.plugins.flags.refresh()

  if (!flag('banks.services.recurrence.enabled')) {
    logger(
      'info',
      'Bailing out of recurrence service since flag "banks.services.recurrence.enabled" is not set'
    )
    return
  }

  await runRecurrenceService({ client })
})
