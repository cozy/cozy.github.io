import CozyClient, { Q } from 'cozy-client'
import get from 'lodash/get'
import uniq from 'lodash/uniq'

import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import {
  GROUP_DOCTYPE,
  ACCOUNT_DOCTYPE,
  TRANSACTION_DOCTYPE,
  RECURRENCE_DOCTYPE
} from 'doctypes'
import { destroyRecurrenceIfEmpty } from 'ducks/recurrence/api'
import { disableOutdatedNotifications } from 'ducks/settings/helpers'
import { getT } from 'utils/lang'

export const DESTROY_ACCOUNT = 'DESTROY_ACCOUNT'
const STACK_FIND_LIMIT = 100

const removeAccountFromGroup = (group, account) => {
  return {
    ...group,
    accounts: group.accounts.filter(accountId => accountId !== account.id)
  }
}

export const deleteOrphanOperations = async (client, account) => {
  // We use a collection here instead of using the client because
  // we want to directly target the stack and bypass the pouch link
  // on mobile.
  const transactionCollection =
    client.stackClient.collection(TRANSACTION_DOCTYPE)
  let count

  const res = []
  while (count === undefined || count === STACK_FIND_LIMIT) {
    const { data: orphanOperations } = await transactionCollection.find({
      account: account._id
    })
    count = orphanOperations.length
    if (count > 0) {
      await transactionCollection.destroyAll(orphanOperations)
      res.push.apply(res, orphanOperations)
    }
  }
  return res
}

const removeAccountFromGroups = async (client, account) => {
  const groups = (await client.query(Q(GROUP_DOCTYPE))).data
  const ugroups = groups.map(group => removeAccountFromGroup(group, account))
  await client.saveAll(ugroups)
}

export const updateRecurrences = async (client, account, deletedOps) => {
  const impactedRecurrenceIds = uniq(
    deletedOps.map(op => get(op, 'relationships.recurrence.data._id'))
  ).filter(Boolean)
  const { data: recurrences } = await client.query(
    Q(RECURRENCE_DOCTYPE).getByIds(impactedRecurrenceIds)
  )
  for (const recurrence of recurrences) {
    await destroyRecurrenceIfEmpty(client, recurrence)
  }
}

export const onAccountDelete = async (client, account) => {
  const t = getT()
  const notif = Alerter.info(t('DeletingAccount.related-data.deleting'), {
    duration: Infinity
  })
  const deletedOps = await deleteOrphanOperations(client, account)
  await removeAccountFromGroups(client, account)
  await updateRecurrences(client, account, deletedOps)
  await disableOutdatedNotifications(client)
  Alerter.removeNotification(notif)
  Alerter.success(t('DeletingAccount.related-data.successfully-deleted'))
}

export const onGroupDelete = async (client, account) => {
  await deleteOrphanOperations(client, account)
  await disableOutdatedNotifications(client)
}

window.onAccountDelete = onAccountDelete
CozyClient.registerHook(ACCOUNT_DOCTYPE, 'before:destroy', onAccountDelete)
CozyClient.registerHook(GROUP_DOCTYPE, 'before:destroy', onGroupDelete)
