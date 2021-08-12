import logger from 'cozy-logger'
import { fetchSettings } from 'ducks/settings/helpers'
import { ACCOUNT_DOCTYPE } from 'doctypes'
import get from 'lodash/get'
import set from 'lodash/set'
import mergeSets from 'utils/mergeSets'
import { addOwnerToAccount } from './helpers'

import { Q } from 'cozy-client'

const log = logger.namespace('link-myself-to-accounts')

const fetchMyself = async client => {
  const response = await client.stackClient.fetchJSON(
    'POST',
    '/contacts/myself'
  )

  const myself = response.data

  // The stack responds with a document that has an `id` property,
  // but no `_id`. We are accustomed to working with `_id`, so to avoid
  // code like `_id || id`, we add the `_id` property to the document
  myself._id = myself.id

  return myself
}

export const linkMyselfToAccounts = async ({ client }) => {
  const settings = await fetchSettings(client)
  const accounts = await client.queryAll(Q(ACCOUNT_DOCTYPE))

  const alreadyProcessed = new Set(
    settings.linkMyselfToAccounts.processedAccounts
  )

  const accountsToProcess = accounts.filter(
    account => !alreadyProcessed.has(account._id)
  )

  if (accountsToProcess.length === 0) {
    log('info', 'No accounts to process, bailing out.')
    return
  }

  let myself

  try {
    myself = await fetchMyself(client)
  } catch (err) {
    log('error', 'Error while fetching myself contact')
    log('error', err)
    return
  }

  for (const account of accountsToProcess) {
    addOwnerToAccount(account, myself)

    await client.save(account)
  }

  const processedAccounts = new Set(accountsToProcess.map(x => x._id))
  settings.linkMyselfToAccounts.processedAccounts = Array.from(
    mergeSets(alreadyProcessed, processedAccounts)
  )
  await client.save(settings)

  log('info', `Linked ${accountsToProcess.length} accounts to myself`)
}

export const unlinkMyselfFromAccounts = async ({ client }) => {
  let myself

  try {
    myself = await fetchMyself(client)
  } catch (err) {
    log('error', 'Error while fetching myself contact')
    log('error', err)
    return
  }

  const accounts = await client.queryAll(Q(ACCOUNT_DOCTYPE))

  for (const account of accounts) {
    const currentOwners = get(account, 'relationships.owners.data', [])
    const ownersWithoutMyself = currentOwners.filter(
      owner => owner._id !== myself._id
    )

    set(account, 'relationships.owners.data', ownersWithoutMyself)

    await client.save(account)
  }

  const settings = await fetchSettings(client)
  settings.linkMyselfToAccounts.processedAccounts = []
  await client.save(settings)

  log('info', 'Unlinked all accounts from myself')
}
