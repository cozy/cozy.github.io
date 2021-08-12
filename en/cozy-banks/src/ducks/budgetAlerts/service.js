import logger from 'cozy-logger'
import { sendNotification } from 'cozy-notifications'
import { updateCategoryAlerts } from 'ducks/settings/helpers'
import { buildNotificationView } from 'ducks/notifications/CategoryBudget/utils'

const log = logger.namespace('category-alerts')

/**
 * Sends category budget notification and updates settings if successful
 */
export const runCategoryBudgetService = async (client, options) => {
  log('info', `Run category budget service`)
  const notifView = buildNotificationView(client, options)
  await sendNotification(client, notifView)
  log('info', `Saving updated alerts`)
  const updatedAlerts = notifView.getUpdatedAlerts()
  if (!updatedAlerts || !updatedAlerts.length) {
    return
  }
  log('info', 'Saving updated category alerts')
  await updateCategoryAlerts(client, updatedAlerts)
}
