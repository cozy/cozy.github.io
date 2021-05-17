import fetch from 'node-fetch'
global.fetch = fetch
import get from 'lodash/get'
import set from 'lodash/set'

import CozyClient from 'cozy-client'
import logger from 'cozy-logger'
import flag from 'cozy-flags'
import { Document } from 'cozy-doctypes'

import { sendNotifications } from 'ducks/notifications/services'
import matchFromBills from 'ducks/billsMatching/matchFromBills'
import matchFromTransactions from 'ducks/billsMatching/matchFromTransactions'
import { logResult } from 'ducks/billsMatching/utils'
import { fetchSettings } from 'ducks/settings/helpers'

import { TRANSACTION_DOCTYPE, BILLS_DOCTYPE } from 'doctypes'
import isCreatedDoc from 'utils/isCreatedDoc'
import { findAppSuggestions } from 'ducks/appSuggestions/services'
import { fetchChangesOrAll, getOptions } from './helpers'
import assert from '../../utils/assert'

const log = logger.namespace('onOperationOrBillCreate')

const doBillsMatching = async (client, setting, options = {}) => {
  // Bills matching
  log('info', 'Bills matching')
  const billsLastSeq =
    options.lastSeq || setting.billsMatching.billsLastSeq || '0'

  try {
    log('info', 'Fetching bills changes...')
    const billsChanges = await fetchChangesOrAll(
      client,
      BILLS_DOCTYPE,
      billsLastSeq
    )
    billsChanges.documents = billsChanges.documents.filter(isCreatedDoc)

    setting.billsMatching.billsLastSeq = billsChanges.newLastSeq

    if (billsChanges.documents.length === 0) {
      log('info', '[matching service] No new bills since last execution')
    } else {
      log(
        'info',
        `[matching service] ${billsChanges.documents.length} new bills since last execution. Trying to find transactions for them`
      )

      const result = await matchFromBills(billsChanges.documents)
      logResult(result)
    }
  } catch (e) {
    log('error', `[matching service] ${e}`)
  }
}

const doTransactionsMatching = async (client, setting, options = {}) => {
  assert(setting, 'No setting passed')
  log('info', 'Do transaction matching...')
  const transactionsLastSeq =
    options.lastSeq || get(setting, 'billsMatching.transactionsLastSeq') || '0'

  try {
    log('info', 'Fetching transactions changes...')
    const transactionsChanges = await fetchChangesOrAll(
      client,
      TRANSACTION_DOCTYPE,
      transactionsLastSeq
    )

    set(
      setting,
      'billsMatching.transactionsLastSeq',
      transactionsChanges.newLastSeq
    )

    if (transactionsChanges.documents.length === 0) {
      log('info', '[matching service] No new operations since last execution')
    } else {
      log(
        'info',
        `[matching service] ${transactionsChanges.documents.length} new transactions since last execution. Trying to find bills for them`
      )

      const result = await matchFromTransactions(transactionsChanges.documents)
      logResult(result)
    }
  } catch (e) {
    log('error', `[matching service] ${e}`)
  }
}

const doSendNotifications = async (setting, notifChanges) => {
  assert(setting, 'No setting passed')
  log('info', 'Do send notifications...')
  try {
    const transactionsToNotify = notifChanges.documents
    await sendNotifications(setting, transactionsToNotify)
    set(
      setting,
      'notifications.lastSeq',
      get(setting, 'billsMatching.transactionsLastSeq')
    )
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
    log('warn', 'Error while sending notifications : ' + e)
  }
}

const doAppSuggestions = async setting => {
  assert(setting, 'No setting passed')
  log('info', 'Do apps suggestions...')
  try {
    await findAppSuggestions(setting)
  } catch (e) {
    log('warn', 'Error while finding app suggestions: ' + e)
  }
}

const updateSettings = async (client, settings) => {
  log('info', 'Updating settings...')
  const { data: newSettings } = await client.save(settings)
  log('info', 'Settings updated')
  return newSettings
}

const launchBudgetAlertService = async client => {
  log('info', 'Launching budget alert service...')
  const jobs = client.collection('io.cozy.jobs')
  await jobs.create('service', {
    name: 'budgetAlerts',
    slug: flag('banking.banking-app-slug') || 'banks'
  })
  log('info', 'Budget alert service launched')
}

const setFlagsFromSettings = settings => {
  // The flag is needed to use local model when getting a transaction category ID
  flag('local-model-override', settings.community.localModelOverride.enabled)

  flag(
    'late-health-reimbursement-limit',
    settings.notifications.lateHealthReimbursement.value
  )
}

const onOperationOrBillCreate = async (client, options) => {
  log('info', `COZY_CREDENTIALS: ${process.env.COZY_CREDENTIALS}`)
  log('info', `COZY_URL: ${process.env.COZY_URL}`)
  log('info', `COZY_JOB_ID: ${process.env.COZY_JOB_ID}`)
  log('info', 'Fetching settings...')
  let setting = await fetchSettings(client)

  setFlagsFromSettings(setting)

  // We fetch the notifChanges before anything else because we need to know if
  // some transactions are totally new in `TransactionGreater` notification.
  // These transactions may be updated by the matching algorithm, and thus
  // may be missed by `TransactionGreater` because their `_rev` don't start with `1`
  const notifLastSeq = setting.notifications.lastSeq
  log('info', 'Fetching transaction changes...')

  const notifChanges = await fetchChangesOrAll(
    client,
    TRANSACTION_DOCTYPE,
    notifLastSeq
  )

  if (options.billsMatching !== false) {
    await doBillsMatching(client, setting, options.billsMatching)
    setting = await updateSettings(client, setting)
  } else {
    log('info', 'Skip bills matching')
  }

  if (options.transactionsMatching !== false) {
    await doTransactionsMatching(client, setting, options.transactionsMatching)
    setting = await updateSettings(client, setting)
  } else {
    log('info', 'Skip transactions matching')
  }

  await doSendNotifications(setting, notifChanges)
  setting = await updateSettings(client, setting)

  await doAppSuggestions(setting)
  setting = await updateSettings(client, setting)

  await launchBudgetAlertService(client)
}

const attachProcessEventHandlers = () => {
  process.on('uncaughtException', err => {
    log('warn', JSON.stringify(err.stack))
  })

  process.on('unhandledRejection', err => {
    log('warn', JSON.stringify(err.stack))
  })
}

const main = async () => {
  attachProcessEventHandlers()
  const client = CozyClient.fromEnv(process.env)
  Document.registerClient(client)
  client.registerPlugin(flag.plugin)
  await client.plugins.flags.initializing
  const options = await getOptions(client)
  log('info', 'Options:')
  log('info', JSON.stringify(options))
  await onOperationOrBillCreate(client, options)
}

main().catch(e => {
  log('critical', e)
  process.exit(1)
})
