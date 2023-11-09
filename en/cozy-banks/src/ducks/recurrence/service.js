import omit from 'lodash/omit'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import { log } from './logger'

import { Q } from 'cozy-client'

import { TRANSACTION_DOCTYPE, RECURRENCE_DOCTYPE } from 'doctypes'
import {
  findAndUpdateRecurrences,
  updateAmountsCategoriesRecurrences
} from 'ducks/recurrence/search'
import { fetchHydratedBundles, saveHydratedBundles } from 'ducks/recurrence/api'
import { getLabel } from 'ducks/recurrence/utils'
import tree from 'ducks/categories/tree'
import addDays from 'date-fns/add_days'

export const NB_DAYS_LOOKBACK = 100

/**
 * Fetch transactions from 3 months back if there is already recurrences,
 * otherwise all transactions.
 * We filter out transactions already associated with a recurrence as we don't
 * want to change it.
 *
 * @param {array} recurrences - Hydrated bundle of recurrences
 * @returns transactions
 */
const makeQueryForTransactions = recurrences => {
  if (recurrences.length === 0) {
    // We still filter out transactions that were explicitely marked as not
    // recurrent.
    return Q(TRANSACTION_DOCTYPE)
      .partialIndex({
        'relationships.recurrence': { $exists: false }
      })
      .limitBy(1000)
  } else {
    const lookbackDateLimit = addDays(new Date(), -NB_DAYS_LOOKBACK)
    const query = Q(TRANSACTION_DOCTYPE)
      .where({
        date: {
          $gt: lookbackDateLimit.toISOString().slice(0, 10)
        }
      })
      .partialIndex({
        'relationships.recurrence': { $exists: false }
      })
      .limitBy(1000)

    return query
  }
}

const getRecurrenceId = recurrence => recurrence._id

export const logDifferences = (oldRecurrences, updatedRecurrences) => {
  const { true: existingRecurrences = [], false: newRecurrences = [] } =
    groupBy(updatedRecurrences, rec => Boolean(getRecurrenceId(rec)))
  const oldById = keyBy(oldRecurrences, getRecurrenceId)
  const existingById = keyBy(existingRecurrences, getRecurrenceId)

  let logForNewRecurrences = []
  let logForExistingRecurrences = []

  for (const [id, existing] of Object.entries(existingById)) {
    logForExistingRecurrences.push(
      `${getLabel(existing)}: ${existing.ops.length} operations (+${
        existing.ops.length - oldById[id].ops.length
      })`
    )
  }

  for (const rec of newRecurrences) {
    logForNewRecurrences.push(
      `${getLabel(rec)}: ${rec.ops.length} operations (+${
        rec.ops.length
      }), category: ${tree[rec.categoryIds[0]]}`
    )
  }

  if (logForNewRecurrences.length > 0) {
    log(
      'info',
      `Modified ${
        newRecurrences.length
      } recurrences:\n${logForNewRecurrences.join('\n')}`
    )
  }

  if (logForExistingRecurrences.length > 0) {
    log(
      'info',
      `${
        existingRecurrences.length
      } existing recurrences :\n${logForExistingRecurrences.join('\n')}`
    )
  }
}

export const logRecurrencesLabelAndTransactionsNumber = ({
  prefix,
  recurrences,
  suffix
}) => {
  const recurrencesLogs = recurrences.map(recurrence => {
    if (!recurrence.ops) {
      return
    }
    return `${getLabel(recurrence)}: ${
      recurrence.ops.length
    } operations, category: ${tree[recurrence.categoryIds[0]]}`
  })

  log(
    'info',
    [prefix, recurrencesLogs.join('\n'), suffix].filter(Boolean).join('\n')
  )
}

/**
 * Fetches
 *   - transactions from the last 100 days with no recurrences
 *   - current recurrences
 * and updates recurrences and transactions according to the recurrence matching
 * algorithm.
 * The date taken into account to create recurrences is `transaction.date` and
 * not `transaction.realizationDate`.
 *
 * Called inside service.
 */
const main = async ({ client }) => {
  try {
    const recurrences = await fetchHydratedBundles(client)

    logRecurrencesLabelAndTransactionsNumber({
      prefix: `⭐ Founded: ${recurrences.length} existing recurrences:`,
      recurrences
    })

    const transactionQuery = makeQueryForTransactions(recurrences)
    log(
      'info',
      `Transactions selector is ${JSON.stringify(transactionQuery.selector)}`
    )
    const transactions = await client.queryAll(transactionQuery)

    if (recurrences.length > 0) {
      log(
        'info',
        `Loaded transactions from ${NB_DAYS_LOOKBACK} days back, ${transactions.length} transactions to consider`
      )
    } else {
      log(
        'info',
        `Loaded all transactions (since there were no recurrences yet), ${transactions.length} transactions to consider`
      )
    }

    const recurrencesAmountsCatIdsUpdated =
      updateAmountsCategoriesRecurrences(recurrences)

    const updatedRecurrences = findAndUpdateRecurrences(
      recurrencesAmountsCatIdsUpdated.map(r => ({ ...r })),
      transactions,
      client
    ).map(x => omit(x, '_type'))

    const { true: emptyRecurrences = [], false: nonEmptyRecurrences = [] } =
      groupBy(updatedRecurrences, x => x.ops.length === 0)

    for (const recurrence of emptyRecurrences) {
      log('info', `Removing empty recurrence ${recurrence._id}`)
      await client.destroy({ _type: RECURRENCE_DOCTYPE, ...recurrence })
    }

    await saveHydratedBundles(client, nonEmptyRecurrences)
  } catch (e) {
    log('error', `[recurrence service] ${e} ${e.stack}`)
    throw e
  }
}

export default main
