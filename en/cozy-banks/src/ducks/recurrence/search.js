import groupBy from 'lodash/groupBy'
import unique from 'lodash/uniq'
import compose from 'lodash/flowRight'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/maxBy'
import flatMap from 'lodash/flatMap'

import defaultRulesConfig from './config.json'
import {
  getRulesFromConfig,
  sameLabel,
  groupBundles,
  addStats,
  overEvery
} from './rules'
import getCategoryId from 'ducks/transactions/getCategoryId'

import { getLabel } from 'ducks/transactions/helpers'

const ONE_DAY = 86400 * 1000

const assert = (pred, msg) => {
  if (!pred) {
    throw new Error(msg)
  }
}

/**
 * How rules work:
 *
 * There are different stages that find and process bundles
 *
 * - Some stages filter bundles
 * - Some change the bundles (map)
 * - Some regroup bundles
 *
 * @param  {array} operations
 * @param  {array} rules
 * @return {array} recurrence groups
 */
export const findRecurrences = (operations, rules) => {
  const groups = groupBy(operations, x => getCategoryId(x))

  let bundles = flatMap(Object.entries(groups), ([categoryId, ops]) => {
    const perAmount = groupBy(ops, op => op.amount)
    return Object.entries(perAmount).map(([amount, ops]) => ({
      categoryIds: [categoryId],
      amounts: [parseInt(amount, 10)],
      key: `${categoryId}/${amount}`,
      ops,
      automaticLabel: getLabel(ops[0])
    }))
  })

  const groupedByStage = groupBy(rules, rule => rule.stage)

  const stageKeys = Object.keys(groupedByStage).sort()
  for (let stageKey of stageKeys) {
    const ruleInfos = groupedByStage[stageKey]
    assert(
      unique(ruleInfos.map(r => r.type)).length === 1,
      'Cannot have multiple types per stage'
    )
    const type = ruleInfos[0].type
    const rules = ruleInfos.map(ruleInfo => ruleInfo.rule)
    if (type === 'filter') {
      bundles = bundles.filter(overEvery(rules))
    } else if (type === 'map') {
      bundles = bundles.map(compose(rules))
    } else if (type === 'group') {
      bundles = groupBundles(bundles, rules)
    } else if (type === 'split') {
      if (rules.length > 1) {
        throw new Error('Cannot have multiple split rules in one stage')
      }
      bundles = flatMap(bundles, rules[0])
    }
  }

  return bundles
}

export const updateRecurrences = (bundles, newTransactions, rules) => {
  if (!newTransactions.length) {
    return bundles
  }
  const maxDate = new Date(maxBy(newTransactions, 'date').date)
  const minDate = new Date(minBy(newTransactions, 'date').date)
  const dateSpan = (maxDate - minDate) / ONE_DAY

  let updatedBundles

  if (dateSpan > 90 && newTransactions.length > 100) {
    const newBundles = findRecurrences(newTransactions, rules)
    const allBundles = [...bundles, ...newBundles]
    updatedBundles = groupBundles(allBundles, sameLabel)
  } else {
    const newBundles = newTransactions.map(t => ({ ops: [t] }))
    const allBundles = [...bundles, ...newBundles]
    updatedBundles = groupBundles(allBundles, sameLabel)
  }

  updatedBundles = bundles.map(addStats)
  return updatedBundles
}

export const findAndUpdateRecurrences = (recurrences, operations) => {
  const rules = getRulesFromConfig(defaultRulesConfig)

  let updatedRecurrences
  if (recurrences.length === 0) {
    updatedRecurrences = findRecurrences(operations, rules)
  } else {
    updatedRecurrences = updateRecurrences(recurrences, operations, rules)
  }
  return updatedRecurrences
}
