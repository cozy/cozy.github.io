/**
 * TODO Handle pagination
 *
 * As of now, paginations for recurrence bundles and for transactions inside
 * recurrence has not been dealt with, both in the API and on the UI side
 * of things. Since having more than 100 hundred recurrences is infrequent,
 * we do not think it is a major hurdle if users only see their 100 most recent
 * recurrences, or only the most recent 100 transactions inside this recurrence
 * bundle.
 */

import set from 'lodash/set'
import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'

import omit from 'lodash/omit'
import { Q, dehydrate } from 'cozy-client'
import maxBy from 'lodash/maxBy'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'

import {
  queryRecurrenceTransactions,
  queryRecurrencesTransactions
} from './queries'
import { TRANSACTION_DOCTYPE, RECURRENCE_DOCTYPE } from 'doctypes'
import { log } from './logger'
import { NOT_RECURRENT_ID } from './constants'

const mostFrequent = (iterable, fn) => {
  const groups = groupBy(iterable, fn)
  return maxBy(Object.entries(groups), ([, ops]) => ops.length)[0]
}

export const getAutomaticLabelFromBundle = bundle =>
  mostFrequent(bundle.ops, op => op.label)

const addRelationship = (doc, relationshipName, definition) => {
  return set(doc, ['relationships', relationshipName], { data: definition })
}

const getRecurrenceIdFromRawTransaction = tr =>
  get(tr, 'relationships.recurrence.data._id', null)

/**
 * Fetch bundles and associated transactions from CouchDB
 * Returns "hydrated" bundles with an `ops` field containing all its transactions
 *
 * @param  {CozyClient} client
 * @return {Promise<HydratedRecurrences>}
 */
export const fetchHydratedBundles = async client => {
  const recurrences = await client.queryAll(Q(RECURRENCE_DOCTYPE).limitBy(1000))
  const transactions = await client.queryAll(
    queryRecurrencesTransactions(recurrences).limitBy(1000)
  )
  const byRecurrence = groupBy(transactions, getRecurrenceIdFromRawTransaction)
  return recurrences.map(rec => ({
    ...rec,
    ops: byRecurrence[rec._id] || []
  }))
}

/**
 * Saves recurrence bundles and update related transactions
 *
 * Recurrence bundles here are "hydrated" with an `ops` attribute with
 * all its operations. In CouchDB, the `ops` field is not present, the
 * transactions have a HasOne relationship to the bundle.
 *
 * @param  {CozyClient} client
 * @param  {HydratedRecurrence} recurrences - Bundles with `ops` attributes
 * @return {Promise}
 */
export const saveHydratedBundles = async (client, recurrenceClientBundles) => {
  const recurrenceCol = client.collection(RECURRENCE_DOCTYPE)
  const saveBundlesResp = await recurrenceCol.updateAll(
    recurrenceClientBundles.map(bundle => {
      const withoutOps = omit(bundle, 'ops')
      withoutOps.accounts = uniq(bundle.ops.map(x => x.account))
      log('info', `Setting accounts to ${withoutOps.accounts}`)
      withoutOps.automaticLabel = getAutomaticLabelFromBundle(bundle)
      const latestOperation = maxBy(bundle.ops, x => x.date)
      withoutOps.latestDate = latestOperation.date
      return withoutOps
    })
  )
  const bundlesWithIds = recurrenceClientBundles.map((recurrenceBundle, i) => ({
    ...recurrenceBundle,
    _id: saveBundlesResp[i].id
  }))

  const ops = flatten(
    bundlesWithIds.map(recurrenceBundle =>
      recurrenceBundle.ops.map(op =>
        addRelationship(dehydrate(op), 'recurrence', {
          _id: recurrenceBundle._id,
          _type: RECURRENCE_DOCTYPE
        })
      )
    )
  )

  const opCollection = client.collection('io.cozy.bank.operations')
  await opCollection.updateAll(ops.map(op => omit(op, '_type')))
}

export const resetBundles = async client => {
  const recurrenceCol = client.collection(RECURRENCE_DOCTYPE)
  const { data: serverBundles } = await recurrenceCol.all()
  await recurrenceCol.destroyAll(serverBundles)
}

const setTransactionAsUnrecurrent = transaction =>
  addRelationship(transaction, 'recurrence', {
    _id: NOT_RECURRENT_ID,
    _type: RECURRENCE_DOCTYPE
  })

export const deleteRecurrence = async (client, recurrence) => {
  const opCollection = client.collection(TRANSACTION_DOCTYPE)
  const { data: ops } = await client.query(
    queryRecurrenceTransactions(recurrence)
  )
  await opCollection.updateAll(
    ops.map(op => setTransactionAsUnrecurrent(omit(op, '_type')))
  )
  await client.destroy(recurrence)
}

export const renameRecurrenceManually = async (
  client,
  recurrence,
  newLabel
) => {
  return client.save({
    ...recurrence,
    manualLabel: newLabel
  })
}

export const STATUS_ONGOING = 'ongoing'
export const STATUS_FINISHED = 'finished'

export const getStatus = recurrence => {
  if (recurrence.status) {
    return recurrence.status
  } else {
    return STATUS_ONGOING
  }
}

export const isOngoing = recurrence => {
  const status = getStatus(recurrence)
  return status === STATUS_ONGOING
}

export const isFinished = recurrence => {
  const status = getStatus(recurrence)
  return status === STATUS_FINISHED
}

export const setStatus = async (client, recurrence, status) => {
  client.save({
    ...recurrence,
    status
  })
}

export const setStatusOngoing = async (client, recurrence) => {
  return setStatus(client, recurrence, STATUS_ONGOING)
}

export const setStatusFinished = async (client, recurrence) => {
  return setStatus(client, recurrence, STATUS_FINISHED)
}

export const destroyRecurrenceIfEmpty = async (client, partialRecurrence) => {
  const { data: recurrenceTransactions } = await client.query(
    queryRecurrenceTransactions(partialRecurrence)
  )
  if (recurrenceTransactions.length === 0) {
    const qdef = Q(partialRecurrence._type).getById(partialRecurrence._id)
    const { data: recurrence } = await client.query(qdef)
    if (recurrence) {
      await client.destroy(recurrence)
    }
  }
}
