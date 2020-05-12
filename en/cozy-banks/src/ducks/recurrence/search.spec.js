import sortBy from 'lodash/sortBy'
import minBy from 'lodash/minBy'
import maxBy from 'lodash/maxBy'
import uniqBy from 'lodash/uniqBy'
import isArray from 'lodash/isArray'

import { TRANSACTION_DOCTYPE } from 'doctypes'
import { td, tr } from 'txt-table-utils'

import { findAndUpdateRecurrences } from './search'
import fixtures from './fixtures'
import { getLabel, getAmount } from './utils'

const formatBundleExtent = bundle => {
  const oldestOp = minBy(bundle.ops, x => x.date)
  const latestOp = maxBy(bundle.ops, x => x.date)
  return `from ${oldestOp.date.slice(0, 10)} to ${latestOp.date.slice(0, 10)}`
}

const assert = (cond, error) => {
  if (!cond) {
    throw new Error(error)
  }
}

const assertUniqueOperations = recurrence => {
  const uniquedOps = uniqBy(recurrence.ops, op => op._id)
  assert(
    recurrence.ops.length === uniquedOps.length,
    `Duplicate ops in recurrence ${getLabel(recurrence)}`
  )
}

const assertValidRecurrence = bundle => {
  assertUniqueOperations(bundle)
  assert(isArray(bundle.amounts), 'Bundle should have amounts array')
  assert(isArray(bundle.categoryIds), 'Bundle should have categoryIds array')
}

const formatRecurrence = bundle =>
  tr(
    td(getLabel(bundle), 50),
    td(getAmount(bundle), 10, 'right'),
    td(`${bundle.ops.length} operations`, 17, 'right'),
    td(formatBundleExtent(bundle), 30, 'right'),
    td(bundle.stats.deltas.median, 7, 'right')
  )

describe('recurrence bundles', () => {
  it('should find new bundles', () => {
    const transactions = fixtures[TRANSACTION_DOCTYPE]
    const recurrences = []
    const updatedRecurrences = findAndUpdateRecurrences(
      recurrences,
      transactions
    )

    updatedRecurrences.forEach(assertValidRecurrence)
    // eslint-disable
    expect(sortBy(updatedRecurrences.map(formatRecurrence))).toEqual([
      'Cozy Cloud                                         |       3963 |      3 operations |  from 2018-06-01 to 2018-09-28 |    59.5',
      'Echeance Pret 03103 61893938                       |      -1281 |     11 operations |  from 2019-03-05 to 2020-01-06 |      31',
      'Edf Clients Particuliers                           |        -36 |     11 operations |  from 2018-08-24 to 2019-06-24 |      31',
      'Free Mobile                                        |        -17 |     15 operations |  from 2018-05-22 to 2020-01-20 |      30',
      'Free Telecom                                       |        -31 |     20 operations |  from 2018-05-07 to 2020-02-06 |      30',
      'Navigo Annuel Gie Comutitres                       |        -75 |     20 operations |  from 2018-06-04 to 2020-03-03 |      31',
      'Paypal Europe S A R L Et Cie S C A Ech             |        -13 |      4 operations |  from 2018-05-29 to 2018-10-30 |      32',
      'Vr Permanent Bourso                                |        -60 |     22 operations |  from 2018-06-04 to 2020-03-02 |      31',
      'Vr Permanent Loyer Douillet                        |       -913 |     11 operations |  from 2018-06-04 to 2019-04-03 |      31'
    ])
  })

  it('should update existing bundles', () => {
    const transactions = fixtures[TRANSACTION_DOCTYPE].filter(
      tr => tr.date < '2019-05'
    )
    const newTransactions = fixtures[TRANSACTION_DOCTYPE].filter(
      tr => tr.date > '2019-05'
    )
    const recurrences = findAndUpdateRecurrences([], transactions)

    expect(sortBy(recurrences.map(formatRecurrence))).toEqual([
      'Cozy Cloud                                         |       3963 |      3 operations |  from 2018-06-01 to 2018-09-28 |    59.5',
      'Edf Clients Particuliers                           |        -36 |      9 operations |  from 2018-08-24 to 2019-04-24 |      31',
      'Free Telecom                                       |        -31 |     12 operations |  from 2018-05-07 to 2019-04-05 |      30',
      'Navigo Annuel Gie Comutitres                       |        -75 |     10 operations |  from 2018-06-04 to 2019-04-03 |      31',
      'Paypal Europe S A R L Et Cie S C A Ech             |        -13 |      4 operations |  from 2018-05-29 to 2018-10-30 |      32',
      'Vr Permanent Bourso                                |        -60 |     11 operations |  from 2018-06-04 to 2019-04-02 |    30.5',
      'Vr Permanent Loyer Douillet                        |       -913 |     11 operations |  from 2018-06-04 to 2019-04-03 |      31'
    ])

    const updatedRecurrences = findAndUpdateRecurrences(
      recurrences,
      newTransactions
    )

    updatedRecurrences.forEach(assertValidRecurrence)

    expect(sortBy(updatedRecurrences.map(formatRecurrence))).toEqual([
      'Cozy Cloud                                         |       3963 |     13 operations |  from 2018-06-01 to 2020-02-28 |    31.5',
      //      'Digitick Billet Marseille | -42 | 5 operations | from 2019-05-20 to 2020-03-31 | 0',
      //      'Echeance Pret 03103 61893938 | -1281 | 11 operations | from 2019-03-05 to 2020-01-06 | 31',
      'Edf Clients Particuliers                           |        -36 |     11 operations |  from 2018-08-24 to 2019-06-24 |      31',
      //      'Free Mobile | -17 | 15 operations | from 2018-05-22 to 2020-01-20 | 30',
      'Free Telecom                                       |        -31 |     25 operations |  from 2018-05-07 to 2020-03-06 |      30',
      'Navigo Annuel Gie Comutitres                       |        -75 |     20 operations |  from 2018-06-04 to 2020-03-03 |      31',
      'Paypal Europe S A R L Et Cie S C A Ech             |        -13 |      8 operations |  from 2018-05-29 to 2019-06-11 |      20',
      'Vr Permanent Bourso                                |        -60 |     22 operations |  from 2018-06-04 to 2020-03-02 |      31',
      'Vr Permanent Loyer Douillet                        |       -913 |     11 operations |  from 2018-06-04 to 2019-04-03 |    30.5'
    ])
  })
})
