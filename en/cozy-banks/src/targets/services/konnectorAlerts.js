import flag from 'cozy-flags'

import { logger } from 'ducks/konnectorAlerts'
import { runService } from './service'
import { sendTriggerNotifications } from './konnectorAlerts/sendTriggerNotifications'
import { createScheduledTrigger } from './konnectorAlerts/createTriggerAt'
import { setIgnoredErrorsFlag } from './konnectorAlerts/setIgnoredErrorsFlag'

const main = async ({ client }) => {
  if (require.main !== module && process.env.NODE_ENV !== 'production') {
    client.registerPlugin(flag.plugin)
    await client.plugins.flags.refresh()
  }
  if (!flag('banks.konnector-alerts')) {
    logger(
      'info',
      'Bailing out of job notifications service since flag "banks.konnector-alerts" is not set'
    )
    return
  }

  await setIgnoredErrorsFlag(client)
  await sendTriggerNotifications(client)
  await createScheduledTrigger(client)
}

if (require.main === module || process.env.NODE_ENV === 'production') {
  runService(main)
}

export default main
