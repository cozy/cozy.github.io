import minBy from 'lodash/minBy'
import maxBy from 'lodash/maxBy'
import uniqBy from 'lodash/uniqBy'
import isArray from 'lodash/isArray'
import { td, tr } from 'txt-table-utils'

import { assert } from './search'
import { getAmount, getLabel } from './utils'

export const formatBundleExtent = bundle => {
  const oldestOp = minBy(bundle.ops, x => x.date)
  const latestOp = maxBy(bundle.ops, x => x.date)
  return `from ${oldestOp.date.slice(0, 10)} to ${latestOp.date.slice(0, 10)}`
}

export const assertUniqueOperations = recurrence => {
  const uniquedOps = uniqBy(recurrence.ops, op => op._id)
  assert(
    recurrence.ops.length === uniquedOps.length,
    `Duplicate ops in recurrence ${getLabel(recurrence)}`
  )
}

export const assertValidRecurrence = bundle => {
  assertUniqueOperations(bundle)
  assert(isArray(bundle.amounts), 'Bundle should have amounts array')
  assert(isArray(bundle.categoryIds), 'Bundle should have categoryIds array')
}

export const formatRecurrence = bundle =>
  tr(
    td(getLabel(bundle), 50),
    td(getAmount(bundle), 10, 'right'),
    td(`${bundle.ops.length} operations`, 17, 'right'),
    td(formatBundleExtent(bundle), 30, 'right'),
    td(bundle.stats.deltas.median, 7, 'right')
  )
