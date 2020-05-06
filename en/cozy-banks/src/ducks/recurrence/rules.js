import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import sum from 'lodash/sum'
import mergeWith from 'lodash/mergeWith'
import isArray from 'lodash/isArray'
import unique from 'lodash/uniq'
import isString from 'lodash/isString'
import compose from 'lodash/flowRight'
import some from 'lodash/some'

const ONE_DAY = 86400 * 1000

const mean = iterable => sum(iterable) / iterable.length
const median = iterable => {
  const sorted = [...iterable].sort()
  if (sorted.length % 2 == 0) {
    const mid = sorted.length / 2
    return (sorted[mid - 1] + sorted[mid]) / 2
  } else {
    const mid = Math.floor(sorted.length / 2)
    return sorted[mid]
  }
}

/**
 * Computes stats on operations
 *
 * @param  {Array} operations
 * @return {Object}
 */
const makeStats = operations => {
  const dates = sortBy(operations, x => x.date).map(x => +new Date(x.date))
  const deltas = dates
    .map((d, i) => (i === 0 ? null : (d - dates[i - 1]) / ONE_DAY))
    .slice(1)
  const m = mean(deltas)
  const med = median(deltas)
  const sqDistToAverage = deltas.map(d => Math.pow(d, 2) - Math.pow(m, 2))
  const sigma = Math.sqrt(sum(sqDistToAverage) / deltas.length)
  const mad = median(deltas.map(d => Math.abs(d - med)))

  return {
    deltas: {
      sigma,
      mean: m,
      median: med,
      mad
    }
  }
}

/**
 * Will return a predicate that returns true only if all
 * predicates return true
 *
 * Lodash as the same function but it is convenient to have
 * it here to be able to add logging easily
 *
 * @param  {Array[Function]} predicates
 * @return {Function}
 */
const overEvery = predicates => item => {
  for (const predicate of predicates) {
    if (!predicate(item)) {
      return false
    }
  }
  return true
}

function customizer(objValue, srcValue) {
  if (isArray(objValue)) {
    return objValue.concat(srcValue)
  } else if (isString(objValue)) {
    return `${objValue} / ${srcValue}`
  }
}

const mergeBundles = bundles => {
  if (bundles.length < 2) {
    return bundles[0]
  } else {
    const bundle = mergeWith(bundles[0], ...bundles.slice(1), customizer)
    return bundle
  }
}

const assert = (pred, msg) => {
  if (!pred) {
    throw new Error(msg)
  }
}

export const groupBundles = (bundles, rules) => {
  const grouper = compose(rules)
  const groups = groupBy(bundles, grouper)
  return Object.values(groups).map(mergeBundles)
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
 * @return {array} recurring bundles
 */
export const findRecurringBundles = (operations, rules) => {
  const groups = groupBy(
    operations,
    x => `${x.manualCategoryId || x.automaticCategoryId}/${x.amount}`
  )

  let bundles = Object.entries(groups).map(([key, ops]) => {
    const [categoryId, amount] = key.split('/')
    return {
      categoryIds: [categoryId],
      amounts: [parseInt(amount, 10)],
      key,
      ops
    }
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
    }
  }

  return bundles
}

export const sameFirstLabel = bundle => {
  return bundle.ops[0].label
}

export const categoryShouldBeSet = () =>
  function categoryShouldBeSet(bundle) {
    return bundle.categoryIds[0] !== '0'
  }

export const bundleSizeShouldBeMoreThan = n =>
  function bundleSizeShouldBeMoreThan(bundle) {
    return bundle.ops.length > n
  }

export const amountShouldBeMoreThan = amount => {
  const condition = bundleAmount => Math.abs(bundleAmount) > amount
  return bundle => some(bundle.amounts, condition)
}

export const deltaMeanSuperiorTo = n =>
  function deltaMeanSuperiorTo(bundle) {
    return bundle.stats.deltas.mean > n
  }

export const deltaMeanInferiorTo = n =>
  function deltaMeanInferiorTo(bundle) {
    return bundle.stats.deltas.mean < n
  }

export const sigmaInferiorTo = n =>
  function sigmaInferiorTo(bundle) {
    return bundle.stats.deltas.sigma < n
  }

export const madInferiorTo = n =>
  function madInferiorTo(bundle) {
    return bundle.stats.deltas.mad < n
  }

export const addStats = bundle => ({ ...bundle, stats: makeStats(bundle.ops) })

export const rulesPerName = {
  categoryShouldBeSet: {
    rule: categoryShouldBeSet,
    description: 'Filter out bundles where the category is not set',
    stage: 0,
    type: 'filter'
  },
  bundleSizeShouldBeMoreThan: {
    rule: bundleSizeShouldBeMoreThan,
    description: 'Filter out bundles where the size is below',
    stage: 0,
    type: 'filter'
  },
  amountShouldBeMoreThan: {
    rule: amountShouldBeMoreThan,
    description: 'Amount of bundle is more than',
    stage: 0,
    type: 'filter'
  },
  addStats: {
    rule: () => addStats,
    description: 'Add stats',
    stage: 1,
    type: 'map'
  },
  deltaMeanSuperiorTo: {
    rule: deltaMeanSuperiorTo,
    description: 'Mean interval in days between operations should be more than',
    stage: 2,
    type: 'filter'
  },
  deltaMeanInferiorTo: {
    rule: deltaMeanInferiorTo,
    description: 'Mean interval in days between operations should be less than',
    stage: 2,
    type: 'filter'
  },
  sigmaInferiorTo: {
    rule: sigmaInferiorTo,
    description:
      "Standard deviation of bundle's date intervals should be less than",
    stage: 2,
    type: 'filter'
  },
  madInferiorTo: {
    rule: madInferiorTo,
    description:
      "Median absolute deviation of bundle's date intervals should be less than",
    stage: 2,
    type: 'filter'
  },
  mergeBundles: {
    rule: () => sameFirstLabel,
    description: 'Merge similar bundles',
    stage: 3,
    type: 'group'
  }
}

export const getRulesFromConfig = config => {
  return Object.entries(config)
    .map(([ruleName, config]) => {
      if (!config.active) {
        return null
      }
      if (!rulesPerName[ruleName]) {
        // eslint-disable-next-line no-console
        console.warn(`Unknown rule ${ruleName}`)
        return null
      }
      const { rule: makeRule, ...rest } = rulesPerName[ruleName]
      return { rule: makeRule(config.options), ...rest }
    })
    .filter(Boolean)
}
