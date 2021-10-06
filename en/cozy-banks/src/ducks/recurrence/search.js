import groupBy from 'lodash/groupBy'
import unique from 'lodash/uniq'
import uniq from 'lodash/uniq'
import compose from 'lodash/flowRight'
import flatMap from 'lodash/flatMap'
import differenceBy from 'lodash/differenceBy'

import defaultRulesConfig from './config.json'
import getCategoryId from 'ducks/transactions/getCategoryId'
import { getLabel } from 'ducks/transactions/helpers'
import {
  addStats,
  getRulesFromConfig,
  groupBundles
} from 'ducks/recurrence/rules'
import { addTransactionToBundles } from 'ducks/recurrence/utils'
import { logRecurrencesLabelAndTransactionsNumber } from 'ducks/recurrence/service'
import { log } from './logger'

export const assert = (pred, msg) => {
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
  log('info', 'Creating new bundle...')
  const groups = groupBy(operations, x => getCategoryId(x))

  let bundles = flatMap(Object.entries(groups), ([categoryId, ops]) => {
    const perAmount = groupBy(ops, op => op.amount)
    return Object.entries(perAmount).map(([amount, ops]) => ({
      categoryIds: [categoryId],
      amounts: [parseInt(amount, 10)],
      ops,
      automaticLabel: getLabel(ops[0])
    }))
  })

  logRecurrencesLabelAndTransactionsNumber({
    prefix: `Should create ${bundles.length} bundles before filtering them:`,
    recurrences: bundles
  })

  const rulesGroupedByStage = groupBy(rules, rule => rule.stage)
  const rulesStageKeys = Object.keys(rulesGroupedByStage).sort()

  for (let rulesStageKey of rulesStageKeys) {
    const rulesInfos = rulesGroupedByStage[rulesStageKey]
    assert(
      unique(rulesInfos.map(r => r.type)).length === 1,
      'Cannot have multiple types per stage'
    )
    const type = rulesInfos[0].type
    const rules = rulesInfos.map(ruleInfo => ruleInfo.rule)

    if (type === 'filter') {
      bundles = bundles.filter(bundle => {
        for (const ruleInfos of rulesInfos) {
          if (!ruleInfos.rule(bundle)) {
            logRecurrencesLabelAndTransactionsNumber({
              prefix: `❗ Excluding bundle from creation. Reason: ${ruleInfos.description}. Excluded bundle:`,
              recurrences: [bundle]
            })
            return false
          }
        }
        return true
      })
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

  logRecurrencesLabelAndTransactionsNumber({
    prefix: `⭐ Created: ${bundles.length} new bundles:`,
    recurrences: bundles
  })

  return bundles
}

export const updateRecurrences = (bundles, newTransactions, rules) => {
  if (!newTransactions.length) {
    return bundles
  }

  let newBundles = []
  let updatedBundles = []

  const {
    updatedBundles: newUpdatedBundles,
    transactionsForUpdatedBundles
  } = addTransactionToBundles(bundles, newTransactions)

  updatedBundles = newUpdatedBundles
  const remainingTransactions = differenceBy(
    newTransactions,
    transactionsForUpdatedBundles
  )

  log(
    'info',
    `${remainingTransactions.length} remaining transactions to consider for creating new bundles`
  )

  if (remainingTransactions.length > 0) {
    newBundles = findRecurrences(remainingTransactions, rules)
  }

  const allBundles = [...updatedBundles, ...newBundles].map(addStats)

  return allBundles
}

export const findAndUpdateRecurrences = (recurrences, operations) => {
  log('info', 'Find and update recurrences...')

  const rules = getRulesFromConfig(defaultRulesConfig)

  let updatedRecurrences
  if (recurrences.length === 0) {
    updatedRecurrences = findRecurrences(operations, rules)
  } else {
    updatedRecurrences = updateRecurrences(recurrences, operations, rules)
  }
  return updatedRecurrences
}

export const updateAmountsCategoriesRecurrences = bundles => {
  const newBundles = [...bundles].map(b => {
    return {
      ...b,
      amounts: uniq(b.ops.map(o => o.amount)),
      categoryIds: uniq(b.ops.map(getCategoryId))
    }
  })
  return newBundles
}
