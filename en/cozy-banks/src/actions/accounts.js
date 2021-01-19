import CozyClient, { Q } from 'cozy-client'
import { GROUP_DOCTYPE, ACCOUNT_DOCTYPE, TRANSACTION_DOCTYPE } from 'doctypes'
import { getLinks } from 'ducks/client/links'

const removeAccountFromGroup = (group, account) => {
  return {
    ...group,
    accounts: group.accounts.filter(accountId => accountId !== account.id)
  }
}

const getStackCollection = doctype => {
  const links = getLinks()
  const stackLink = links.find(x => !!x.stackClient)
  return stackLink.stackClient.collection(doctype)
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

const removeAccountFromGroups = async account => {
  const groupCollection = getStackCollection(GROUP_DOCTYPE)
  const groups = (await groupCollection.all(GROUP_DOCTYPE)).data
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
export const destroyReferences = async (client, account) => {
  await deleteOrphanOperations(client, account)
  await removeAccountFromGroups(account)
  await removeStats(client, account)
}

CozyClient.registerHook(ACCOUNT_DOCTYPE, 'before:destroy', destroyReferences)
