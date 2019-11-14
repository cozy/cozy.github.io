import logger from 'cozy-logger'
import CozyClient from 'cozy-client'
import { initTranslation } from 'cozy-ui/react/I18n/translation'

import BalanceLower from './BalanceLower'
import TransactionGreater from './TransactionGreater'
import HealthBillLinked from './HealthBillLinked'
import LateHealthReimbursement from './LateHealthReimbursement'
import DelayedDebit from './DelayedDebit'

import { BankAccount } from 'models'
import { sendNotification } from 'cozy-notifications'

const log = logger.namespace('notification-service')

const lang = process.env.COZY_LOCALE || 'en'
const dictRequire = lang => require(`../../locales/${lang}`)
const translation = initTranslation(lang, dictRequire)
const t = translation.t.bind(translation)

const notificationClasses = [
  BalanceLower,
  TransactionGreater,
  HealthBillLinked,
  LateHealthReimbursement,
  DelayedDebit
]

const setDifference = (a, b) => {
  return new Set([...a].filter(x => !b.has(x)))
}

export const fetchTransactionAccounts = async transactions => {
  const accountsIds = new Set(transactions.map(x => x.account))
  const accounts = await BankAccount.getAll(accountsIds)
  const existingAccountIds = new Set(accounts.map(x => x._id))
  const absentAccountIds = setDifference(accountsIds, existingAccountIds)

  const delta = accountsIds.size - existingAccountIds.size
  if (delta) {
    log(
      'warn',
      `${delta} account(s) do not exist (ids: ${Array.from(
        absentAccountIds
      ).join(',')})`
    )
  }

  return accounts
}

const getClassConfig = (Klass, config) => config.notifications[Klass.settingKey]

export const getEnabledNotificationClasses = config => {
  return notificationClasses.filter(Klass => {
    const klassConfig = getClassConfig(Klass, config)
    let enabled = klassConfig && klassConfig.enabled
    if (enabled && Klass.isValidConfig) {
      enabled = Klass.isValidConfig(klassConfig)
    }
    log('info', `${Klass.settingKey} is ${enabled ? '' : 'not'} enabled`)
    return enabled
  })
}

export const sendNotifications = async (config, transactions) => {
  const enabledNotificationClasses = getEnabledNotificationClasses(config)
  const accounts = await fetchTransactionAccounts(transactions)
  log(
    'info',
    `${transactions.length} new transactions on ${accounts.length} accounts.`
  )
  for (const Klass of enabledNotificationClasses) {
    const klassConfig = getClassConfig(Klass, config)
    const client = CozyClient.fromEnv(process.env)
    const notificationView = new Klass({
      ...klassConfig,
      client,
      t,
      locales: {
        [lang]: dictRequire(lang)
      },
      lang,
      data: { accounts, transactions }
    })
    try {
      await sendNotification(client, notificationView)
    } catch (err) {
      log('warn', JSON.stringify(err))
    }
  }
}
