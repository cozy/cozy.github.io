import { merge, get } from 'lodash'
import { DOCTYPE, DEFAULTS_SETTINGS } from 'ducks/settings/constants'

export const isNotificationEnabled = settings => {
  return (
    get(settings, 'notifications.balanceLower.enabled') ||
    get(settings, 'notifications.transactionGreater.enabled') ||
    get(settings, 'notifications.healthBillLinked.enabled')
  )
}

export const getDefaultedSettings = incompleteSettings => {
  return merge({}, DEFAULTS_SETTINGS, incompleteSettings)
}

export const fetchSettings = async client => {
  const settingsCol = await client.query(client.find(DOCTYPE))
  return getDefaultedSettingsFromCollection(settingsCol)
}

export const getDefaultedSettingsFromCollection = col => {
  const settings = get(col, 'data[0]')
  return getDefaultedSettings(settings)
}
