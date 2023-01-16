/* global __DEVELOPMENT__ */

import flag from 'cozy-flags'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { isIOS } from 'cozy-device-helper'
import { updateNotificationToken } from 'ducks/client/utils'

let push

/**
 * When we receive a notification while the app is in foreground, all on('notification')
 * handlers are executed. But we don't want to redirect the user without his consent.
 * So we redirect only when the user taps on the notification in the notification center.
 * In this case, the app is always in background.
 */
const handleNotification = notification => {
  if (notification.additionalData.foreground && isIOS()) {
    // on iOS the the notification does not appear if the application is in foreground
    Alerter.info(notification.title + ' : ' + notification.message)
  }
  if (flag('debug')) {
    // eslint-disable-next-line no-console
    console.log('Received notification', notification)
  }
  if (
    !notification.additionalData.foreground &&
    notification.additionalData.route
  ) {
    window.location.hash = `#${notification.additionalData.route}`
  }
}

export const startPushNotifications = cozyClient => {
  if (push) {
    // eslint-disable-next-line no-console
    console.warn('Push notifications already started')
    return
  }

  if (!window.PushNotification) {
    // eslint-disable-next-line no-console
    console.warn('No window.PushNotification, did not start push notifications')
    return
  }

  const handleRegistrationError = err => {
    // eslint-disable-next-line no-console
    console.error('push-notifications: Registration failed', err)
  }

  const handleRegistrationSuccess = ({ registrationId }) => {
    // eslint-disable-next-line no-console
    console.info('PushNotifications registered', { registrationId })
    updateNotificationToken(cozyClient, registrationId)
  }

  push = window.PushNotification.init({
    android: {
      forceShow: true,
      clearNotifications: false
    },
    ios: {
      alert: 'true',
      badge: 'true',
      sound: 'true'
    }
  })

  push.on('notification', handleNotification)
  push.on('error', handleRegistrationError)
  push.on('registration', handleRegistrationSuccess)
}

export const _stopPushNotifications = () =>
  new Promise((resolve, reject) => {
    if (push) {
      push.unregister(
        () => {
          push = null
          resolve()
        },
        error => {
          reject(new Error('error while unregistering notifications: ' + error))
        }
      )
    } else {
      reject(
        new Error("Can't stop push notifications because they were not started")
      )
    }
  })

export const stopPushNotifications = async () => {
  try {
    await _stopPushNotifications()

    if (__DEVELOPMENT__) {
      // eslint-disable-next-line no-console
      console.info('Stopped push notifications')
    }
  } catch (e) {
    if (__DEVELOPMENT__) {
      // eslint-disable-next-line no-console
      console.warn('Error while stopping push notification', e)
    }
  }
}

/**
 * Push plugin for CozyClient
 *
 * Registers lifecycle handlers to
 *
 * - register push notifications on login
 * - stop push notifications on logout
 */
export default class PushPlugin {
  constructor(client) {
    client.on('login', async () => {
      await startPushNotifications(client)
    })

    client.on('logout', async () => {
      await stopPushNotifications()
    })
  }
}

PushPlugin.pluginName = 'push'
