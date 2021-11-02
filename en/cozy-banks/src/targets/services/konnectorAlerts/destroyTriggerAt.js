import { logger } from 'ducks/konnectorAlerts'
import { getTriggerStates, fetchRelatedAtTriggers } from './helpers'

export const destroyTriggerAt = async client => {
  logger('info', `⌛ Try to destroy @at triggers...`)

  const count = []

  // TODO: We could fetch the non errored triggers directly,
  // and pass a list of ids to fetchRelatedAtTriggers
  // which would avoid making the request in the loop
  const settingTriggerStates = await getTriggerStates(client)

  for (const [id, triggerStates] of Object.entries(settingTriggerStates)) {
    const relatedAtTriggers = await fetchRelatedAtTriggers(client, id)

    if (relatedAtTriggers.length > 0 && triggerStates.status !== 'errored') {
      for (const relatedAtTrigger of relatedAtTriggers) {
        await client.destroy(relatedAtTrigger)
      }

      count.push(id)
      logger('info', `⭐ Deleted: @at triggers for konnectorTriggerId: ${id}`)
    }
  }

  logger(
    'info',
    `➡️  @at triggers destroyed for ${count.length} konnector triggers`
  )
}
