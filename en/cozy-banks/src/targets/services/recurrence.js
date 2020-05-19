import { runService } from './service'
import { doRecurrenceMatching } from 'ducks/recurrence/service'
import { log } from 'ducks/recurrence/logger'
import { Settings } from 'models'
import flag from 'cozy-flags'

runService(async ({ client }) => {
  const settings = await Settings.fetchWithDefault()
  const localModelOverrideValue = settings.community.localModelOverride.enabled
  log('info', 'Setting local model override flag to ' + localModelOverrideValue)
  flag('local-model-override', localModelOverrideValue)
  await doRecurrenceMatching(client)
})
