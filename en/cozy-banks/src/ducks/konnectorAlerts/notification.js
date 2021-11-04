import merge from 'lodash/merge'

import flag from 'cozy-flags'

import NotificationView from 'ducks/notifications/BaseNotificationView'
import { getCurrentDate } from 'ducks/notifications/utils'

import template from 'ducks/konnectorAlerts/template.hbs'
import logger from 'ducks/konnectorAlerts/logger'
import { ONE_DAY } from 'ducks/recurrence/constants'

// TODO Deep import not to import React components
// Should be solved by having two different entrypoints, one from browser, one for node
import {
  getErrorLocaleBound,
  KonnectorJobError
} from 'cozy-harvest-lib/dist/helpers/konnectors'

/**
 * Returns the next date time at 8ish
 *
 * If now is earlier than 8AM, return today at 8, otherwise
 * tomorrow at 8.
 *
 * A bit of fuzziness is added so that every notification is not sent
 * exactly at the same time, to reduce the spike on the servers.
 */
export const getScheduleDate = currentDate => {
  let date = currentDate || new Date()
  let hours = 8
  let minutes = Math.round(15 * Math.random())

  if (
    date.getHours() > hours ||
    (date.getHours() === hours && date.getMinutes() >= minutes)
  ) {
    // If its too late for today, it'll be the next day
    date = new Date(+date + ONE_DAY)
  }

  date.setHours(hours)
  date.setMinutes(minutes)

  return date
}

/**
 * Manages the notification sent for konnector alerts
 * - Uses the same locales as Harvest in the content of the email
 */
class KonnectorAlertNotification extends NotificationView {
  constructor(options) {
    super(options)
    this.currentDate = options.currentDate
    this.konnectorAlerts = options.konnectorAlerts

    const flagPreferredChannel = flag('banks.konnector-alerts.channel')
    if (flagPreferredChannel) {
      KonnectorAlertNotification.preferredChannels = [flagPreferredChannel]
      logger(
        'info',
        `Set KonnectorAlertNotification preferredChannel to ${flagPreferredChannel} because of flag`
      )
    }
  }

  shouldSend(templateData) {
    const willSend =
      !!templateData.konnectorAlerts && templateData.konnectorAlerts.length > 0
    if (!willSend) {
      logger('info', 'Nothing to send, bailing out')
    }
    return willSend
  }

  async buildData() {
    const data = {
      date: getCurrentDate(),
      konnectorAlerts: this.konnectorAlerts.map(alert => {
        const { trigger, konnectorName } = alert
        const konnError = new KonnectorJobError(
          trigger.current_state.last_error
        )
        const title = getErrorLocaleBound(
          konnError,
          konnectorName,
          this.lang,
          'title'
        )
        const description = this.t('Transactions.trigger-error.description', {
          bankName: konnectorName
        })
        return {
          ...alert,
          title,
          description
        }
      }),
      ctaText: this.t('Transactions.trigger-error.cta'),
      homeUrl: this.urls.homeUrl
    }

    return data
  }

  getTitle(templateData) {
    const { konnectorAlerts } = templateData
    const hasMultipleAlerts = konnectorAlerts.length > 1
    return hasMultipleAlerts
      ? this.t('Notifications.konnectorAlerts.email.title-multi', {
          alertCount: konnectorAlerts.length
        })
      : this.t('Notifications.konnectorAlerts.email.title-single', {
          konnectorName: konnectorAlerts[0].konnectorName
        })
  }

  getPushContent(templateData) {
    const { konnectorAlerts } = templateData
    const hasMultipleAlerts = konnectorAlerts.length > 1
    return hasMultipleAlerts
      ? this.t('Notifications.konnectorAlerts.push.content-multi', {
          konnectorNames: konnectorAlerts.map(x => x.konnectorName).join(', ')
        })
      : this.t('Notifications.konnectorAlerts.push.content-single')
  }

  getExtraAttributes() {
    const attributes = super.getExtraAttributes()
    const flagNow = flag('banks.konnector-alerts.schedule-now')
    if (!flagNow) {
      const date = getScheduleDate()
      const flagAt = flag('banks.konnector-alerts.schedule-date')
      const at = flagAt || date.toISOString()
      logger('info', `Scheduling notification at ${at}`)
      attributes.at = at
    }

    return merge(attributes, {
      data: {
        route: '/settings/accounts'
      }
    })
  }
}

KonnectorAlertNotification.template = template
KonnectorAlertNotification.category = 'konnector-alerts'
KonnectorAlertNotification.preferredChannels = ['mobile', 'mail']

export default KonnectorAlertNotification
