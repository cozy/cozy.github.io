/**
 * Provides a way to test notifications HTML content in the browser
 * and in tests.
 *
 * Data for templates is mocked by overriding the `fetchData` method
 * of Notification views.
 *
 * TODO Move common-test and testTemplates to cozy-notifications
 */

import fs from 'fs'
import { buildAttributes } from 'cozy-notifications'

const readJSONSync = filename => {
  return JSON.parse(fs.readFileSync(filename))
}

export const EMAILS = {
  BalanceLower: {
    klass: require('./BalanceLower').default,
    data: readJSONSync('src/ducks/notifications/BalanceLower/data.json'),
    config: readJSONSync('src/ducks/notifications/BalanceLower/config.json')
  },

  HealthBillLinked: {
    klass: require('./HealthBillLinked').default,
    data: readJSONSync('src/ducks/notifications/HealthBillLinked/data.json')
  },

  TransactionGreater: {
    klass: require('./TransactionGreater').default,
    data: readJSONSync('src/ducks/notifications/TransactionGreater/data.json')
  },

  LateHealthReimbursement: {
    klass: require('./LateHealthReimbursement').default,
    data: readJSONSync(
      'src/ducks/notifications/LateHealthReimbursement/data.json'
    )
  },

  DelayedDebit: {
    klass: require('./DelayedDebit').default,
    data: readJSONSync('src/ducks/notifications/DelayedDebit/data.json')
  }
}

export const setup = (templateName, lang) => {
  const localeStrings = require(`locales/${lang}`)
  const {
    initTranslation
  } = require('cozy-ui/transpiled/react/providers/I18n/translation')
  const translation = initTranslation(lang, () => localeStrings)
  const t = translation.t.bind(translation)
  const cozyURL = 'https://test.mycozy.cloud'
  const notificationView = new EMAILS[templateName].klass({
    t,
    lang,
    data: {},
    ...EMAILS[templateName].config,
    locales: {
      [lang]: localeStrings
    },
    client: {
      stackClient: {
        uri: cozyURL
      }
    }
  })
  return { notificationView }
}

export const buildNotificationAttributes = async (templateName, lang) => {
  const { notificationView } = setup(templateName, lang)

  // Mock fetchData to pass fixture data
  notificationView.fetchData = async () => {
    return EMAILS[templateName].data
  }

  return await buildAttributes(notificationView)
}
