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

const NB_MONTH_LOOKBACK = 3
const DAYS_IN_MONTH = 30.5

const makeQueryForTransactions = recurrences => {
  if (recurrences.length === 0) {
    return Q(TRANSACTION_DOCTYPE)
  } else {
    const lookbackDateLimit = addDays(
      new Date(),
      -NB_MONTH_LOOKBACK * DAYS_IN_MONTH
    )
    const query = Q(TRANSACTION_DOCTYPE).where({
      date: {
        $gt: lookbackDateLimit.toISOString().slice(0, 10)
      }
    })

    return query
  }
}

const getRecurrenceId = recurrence => recurrence._id

const logDifferences = (oldRecurrences, updatedRecurrences) => {
  const {
    true: existingRecurrences = [],
    false: newRecurrences = []
  } = groupBy(updatedRecurrences, rec => Boolean(getRecurrenceId(rec)))
  const oldById = keyBy(oldRecurrences, getRecurrenceId)
  const existingById = keyBy(existingRecurrences, getRecurrenceId)
  log('info', `${newRecurrences.length} new recurrences`)
  for (const [id, existing] of Object.entries(existingById)) {
    log(
      'info',
      `${getLabel(existing)}: ${existing.ops.length} operations (+${existing.ops
        .length - oldById[id].ops.length})`
    )
  }
  for (const rec of newRecurrences) {
    log(
      'info',
      `${getLabel(rec)}: ${rec.ops.length} operations (+${
        rec.ops.length
      }), category: ${tree[rec.categoryIds[0]]}`
    )
  }
}
/**
 * Fetches
 *   - transactions in the last 3 months
 *   - current recurrences
 * and update recurrences and operations according to recurrence matching
 * algorithm.
 *
 * Called inside service.
 */
const main = async ({ client }) => {
  try {
    const recurrences = await fetchHydratedBundles(client)

    log('info', `Found ${recurrences.length} existing recurrences`)
    recurrences.forEach(recurrence => {
      if (!recurrence.ops) {
        return
      }
      log(
        'info',
        `${getLabel(recurrence)}: ${recurrence.ops.length} operations`
      )
    })

    const transactionQuery = makeQueryForTransactions(recurrences)
    const transactions = await client.queryAll(transactionQuery)

    if (recurrences.length > 0) {
      log(
        'info',
        `Loaded transactions from ${NB_MONTH_LOOKBACK} months back, ${transactions.length} transactions to consider`
      )
    } else {
      log(
        'info',
        `Loaded all transactions (since there were no recurrences yet), ${transactions.length} transactions to consider`
      )
    }

    const recurrencesAmountsCatIdsUpdated = updateAmountsCategoriesRecurrences(
      recurrences
    )

    const updatedRecurrences = findAndUpdateRecurrences(
      recurrencesAmountsCatIdsUpdated.map(r => ({ ...r })),
      transactions
    ).map(x => omit(x, '_type'))

    log(
      'info',
      `Added ${updatedRecurrences.length - recurrences.length} new recurrences`
    )

    logDifferences(recurrences, updatedRecurrences)

    const {
      true: emptyRecurrences = [],
      false: nonEmptyRecurrences = []
    } = groupBy(updatedRecurrences, x => x.ops.length === 0)

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
