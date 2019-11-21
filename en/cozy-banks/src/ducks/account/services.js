import logger from 'cozy-logger'
import { updateSettings, fetchSettings } from 'ducks/settings/helpers'
import { ACCOUNT_DOCTYPE, CONTACT_DOCTYPE } from 'doctypes'
import get from 'lodash/get'
import set from 'lodash/set'
import mergeSets from 'utils/mergeSets'
import { addOwnerToAccount } from './helpers'

const log = logger.namespace('link-myself-to-accounts')

const fetchMyself = async client => {
  const response = await client.query(
    client.find(CONTACT_DOCTYPE, { me: true }).limitBy(1)
  )

  const [myself] = response.data

  return myself
}

export const linkMyselfToAccounts = async ({ client }) => {
  const settings = await fetchSettings(client)
  const accounts = await client.queryAll(client.all(ACCOUNT_DOCTYPE))

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

  const myself = await fetchMyself(client)

  if (!myself) {
    log('info', 'No myself contact found, bailing out.')
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
  await updateSettings(client, settings)

  log('info', `Linked ${accountsToProcess.length} accounts to myself`)
}

export const unlinkMyselfFromAccounts = async ({ client }) => {
  const myself = await fetchMyself(client)

  if (!myself) {
    log('error', 'No myself, impossible to get its id to unlink it')
    return
  }

  const accounts = await client.queryAll(client.all(ACCOUNT_DOCTYPE))

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
  await updateSettings(client, settings)

  log('info', 'Unlinked all accounts from myself')
}
