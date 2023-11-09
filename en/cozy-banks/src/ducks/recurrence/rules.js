import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import sum from 'lodash/sum'
import mergeWith from 'lodash/mergeWith'
import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import isEmpty from 'lodash/isEmpty'
import compose from 'lodash/flowRight'
import some from 'lodash/some'
import maxBy from 'lodash/maxBy'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import getCategoryId from 'ducks/transactions/getCategoryId'
import { getLabel } from './utils'
import { findMatchingBrand, getBrands } from 'ducks/brandDictionary'
import { ONE_DAY } from 'ducks/recurrence/constants'

const mean = iterable => sum(iterable) / iterable.length
export const median = iterable => {
  const sorted = sortBy([...iterable])
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

  // Days between a transaction and the next one.
  // First result is between first and second transactions
  // Second result is between second and third transactions etc.
  const deltas = dates
    .map((d, i) => (i === 0 ? null : (d - dates[i - 1]) / ONE_DAY))
    .slice(1)

  // Mean interval in days between operations
  const m = mean(deltas)

  // Median number of days between transactions
  const med = operations.length < 3 ? 30 : median(deltas)
  const sqDistToAverage = deltas.map(d => Math.pow(d, 2) - Math.pow(m, 2))

  // Standard deviation of bundle's date intervals
  const sigma = Math.sqrt(sum(sqDistToAverage) / deltas.length)

  // Median absolute deviation of bundle's date intervals
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

const getTransactionDate = x => x.date

export const mergeCategoryIds = (obj, src) => {
  if (isEmpty(obj.ops) || isEmpty(src.ops)) {
    return []
  }
  // When merging two bundles, we put the most recent categoryId in front
  const mostRecentObjOp = maxBy(obj.ops, getTransactionDate)
  const mostRecentSrcOp = maxBy(src.ops, getTransactionDate)
  const mostRecentOp = maxBy(
    [mostRecentObjOp, mostRecentSrcOp],
    getTransactionDate
  )
  const firstCat = getCategoryId(mostRecentOp)
  const otherCats = uniq(
    [...obj.categoryIds, ...src.categoryIds].filter(x => x !== firstCat)
  )
  return [firstCat, ...otherCats]
}

function customizer(objValue, srcValue, key, obj, src) {
  if (key === 'categoryIds') {
    return mergeCategoryIds(obj, src)
  } else if (key == 'ops') {
    return uniqBy(objValue.concat(srcValue), x => x._id)
  } else if (isString(objValue)) {
    return objValue
  } else if (isArray(objValue)) {
    return objValue.concat(srcValue)
  }
}

export const mergeBundles = bundles => {
  if (bundles.length < 2) {
    return bundles[0]
  } else {
    const bundle = mergeWith(bundles[0], ...bundles.slice(1), customizer)
    return bundle
  }
}

export const groupBundles = (bundles, rules) => {
  const grouper = compose(rules)
  const groups = groupBy(bundles, grouper)
  return Object.values(groups).map(mergeBundles)
}

export const sameLabel = bundle => {
  if (bundle.ops && bundle.ops.length > 0) {
    return bundle.ops[0].label
  } else {
    return getLabel(bundle)
  }
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

export const addStats = bundle => ({
  ...bundle,
  stats: makeStats(bundle.ops)
})

export const brandSplit = () => (bundle, client) => {
  const brands = getBrands(undefined, client)
  const brandGroups = groupBy(bundle.ops, op => {
    const brand = findMatchingBrand(brands, op.label)
    return brand ? brand.name : null
  })
  return Object.values(brandGroups).map(ops => {
    const brand = findMatchingBrand(brands, ops[0].label)
    return {
      ...bundle,
      ops: ops,
      brand: brand ? brand.name : null,
      categoryIds: uniq(ops.map(o => getCategoryId(o))),
      amounts: uniq(ops.map(o => o.amount))
    }
  })
}

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
    description: 'Amount of bundle should be more than',
    stage: 0,
    type: 'filter'
  },
  splitBrands: {
    rule: brandSplit,
    description: 'Make sure two brands cannot be in the same bundle',
    stage: 1,
    type: 'split'
  },
  addStats: {
    rule: () => addStats,
    description: 'Add stats',
    stage: 2,
    type: 'map'
  },
  deltaMeanSuperiorTo: {
    rule: deltaMeanSuperiorTo,
    description: 'Mean interval in days between operations should be more than',
    stage: 3,
    type: 'filter'
  },
  deltaMeanInferiorTo: {
    rule: deltaMeanInferiorTo,
    description: 'Mean interval in days between operations should be less than',
    stage: 3,
    type: 'filter'
  },
  sigmaInferiorTo: {
    rule: sigmaInferiorTo,
    description:
      "Standard deviation of bundle's date intervals should be less than",
    stage: 3,
    type: 'filter'
  },
  madInferiorTo: {
    rule: madInferiorTo,
    description:
      "Median absolute deviation of bundle's date intervals should be less than",
    stage: 3,
    type: 'filter'
  },
  mergeBundles: {
    rule: () => sameLabel,
    description: 'Merge similar bundles',
    stage: 4,
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
