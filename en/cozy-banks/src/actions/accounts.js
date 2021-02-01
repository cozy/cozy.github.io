import CozyClient, { Q } from 'cozy-client'
import { GROUP_DOCTYPE, ACCOUNT_DOCTYPE, TRANSACTION_DOCTYPE } from 'doctypes'
import { disableOutdatedNotifications } from 'ducks/settings/helpers'

const removeAccountFromGroup = (group, account) => {
  return {
    ...group,
    accounts: group.accounts.filter(accountId => accountId !== account.id)
  }
}

const STACK_FIND_LIMIT = 100

export const deleteOrphanOperations = async (client, account) => {
  // We use a collection here instead of using the client because
  // we want to directly target the stack and bypass the pouch link
  // on mobile.
  const transactionCollection = client.stackClient.collection(
    TRANSACTION_DOCTYPE
  )
  let count
  while (count === undefined || count === STACK_FIND_LIMIT) {
    const { data: orphanOperations } = await transactionCollection.find({
      account: account._id
    })
    count = orphanOperations.length
    if (count > 0) {
      await transactionCollection.destroyAll(orphanOperations)
    }
  }
}

const removeAccountFromGroups = async (client, account) => {
  const groupCollection = client.stackClient.collection(GROUP_DOCTYPE)
  const groups = (await groupCollection.all()).data
  const ugroups = groups.map(group => removeAccountFromGroup(group, account))
  for (let ugroup of ugroups) {
    await groupCollection.update(ugroup)
  }
}

export const removeStats = async (client, account) => {
  const statsResponse = await client.query(
    Q('io.cozy.bank.accounts.stats').where({
      'relationships.account.data._id': account._id
    })
  )

  for (const accountStats of statsResponse.data) {
    await client.destroy(accountStats)
  }
}

export const DESTROY_ACCOUNT = 'DESTROY_ACCOUNT'
const onAccountDelete = async (client, account) => {
  await deleteOrphanOperations(client, account)
  await removeAccountFromGroups(client, account)
  await removeStats(client, account)
  await disableOutdatedNotifications(client)
}

export const onGroupDelete = async (client, account) => {
  await deleteOrphanOperations(client, account)
  await removeAccountFromGroups(client, account)
  await removeStats(client, account)
  await disableOutdatedNotifications(client)
}

CozyClient.registerHook(ACCOUNT_DOCTYPE, 'before:destroy', onAccountDelete)
CozyClient.registerHook(GROUP_DOCTYPE, 'before:destroy', onGroupDelete)
