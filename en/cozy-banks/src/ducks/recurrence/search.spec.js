import sortBy from 'lodash/sortBy'
import minBy from 'lodash/minBy'
import maxBy from 'lodash/maxBy'
import uniqBy from 'lodash/uniqBy'
import isArray from 'lodash/isArray'

import { TRANSACTION_DOCTYPE } from 'doctypes'
import { td, tr } from 'txt-table-utils'

import { findAndUpdateRecurrences } from './search'
import { getLabel, getAmount } from './utils'
import fixtures from './fixtures.json'
import fixtures2 from './fixtures2.json'
import fixtures3 from './fixtures3.json'

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
    expect(
      sortBy(updatedRecurrences.map(formatRecurrence)).join('\n')
    ).toMatchSnapshot()
  })

  it('should find new bundles (split brand necessary)', () => {
    const transactions = fixtures2[TRANSACTION_DOCTYPE]
    const recurrences = []
    const updatedRecurrences = findAndUpdateRecurrences(
      recurrences,
      transactions
    )

    updatedRecurrences.forEach(assertValidRecurrence)
    // eslint-disable
    expect(
      sortBy(updatedRecurrences.map(formatRecurrence)).join('\n')
    ).toMatchSnapshot()
  })

  it('should find new bundles', () => {
    const transactions = fixtures3[TRANSACTION_DOCTYPE]
    const recurrences = []
    const updatedRecurrences = findAndUpdateRecurrences(
      recurrences,
      transactions
    )

    updatedRecurrences.forEach(assertValidRecurrence)
    // eslint-disable
    expect(
      sortBy(updatedRecurrences.map(formatRecurrence)).join('\n')
    ).toMatchSnapshot()
  })

  it('should update existing bundles', () => {
    const transactions = fixtures[TRANSACTION_DOCTYPE].filter(
      tr => tr.date < '2019-05'
    )
    const newTransactions = fixtures[TRANSACTION_DOCTYPE].filter(
      tr => tr.date > '2019-05'
    )
    const recurrences = findAndUpdateRecurrences([], transactions)

    expect(
      sortBy(recurrences.map(formatRecurrence)).join('\n')
    ).toMatchSnapshot()

    const updatedRecurrences = findAndUpdateRecurrences(
      recurrences,
      newTransactions
    )

    updatedRecurrences.forEach(assertValidRecurrence)

    expect(
      sortBy(updatedRecurrences.map(formatRecurrence)).join('\n')
    ).toMatchSnapshot()
  })
})
