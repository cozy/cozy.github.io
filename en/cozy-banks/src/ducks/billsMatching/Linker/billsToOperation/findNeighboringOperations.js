const { getDateRangeFromBill, getAmountRangeFromBill } = require('./helpers')
const { log } = require('../../utils')

// cozy-stack limit to 100 elements max
const COZY_STACK_QUERY_LIMIT = 100

// Get the operations corresponding to the date interval
// around the date of the bill
const createDateSelector = (bill, options) => {
  const { minDate, maxDate } = getDateRangeFromBill(bill, options)
  return {
    $gt: minDate.toISOString(),
    $lt: maxDate.toISOString()
  }
}

// Get the operations corresponding to the date interval
// around the amount of the bill
const createAmountSelector = (bill, options) => {
  const { minAmount, maxAmount } = getAmountRangeFromBill(bill, options)

  return {
    $gte: minAmount,
    $lte: maxAmount
  }
}

const getQueryOptions = (bill, options, ids) => {
  const queryOptions = {
    selector: {
      date: createDateSelector(bill, options),
      amount: createAmountSelector(bill, options)
    },
    sort: [{ date: 'desc' }, { amount: 'desc' }],
    COZY_STACK_QUERY_LIMIT
  }

  if (ids.length > 0) {
    queryOptions.skip = ids.length
  }

  log(
    'debug',
    `Query options for bill ${bill._id}: ${JSON.stringify(queryOptions)}`
  )

  return queryOptions
}

const and = conditions => obj => {
  for (let c of conditions) {
    if (!c(obj)) {
      return false
    }
  }
  return true
}

const findByMangoQuerySimple = (docs, query) => {
  const selector = query.selector
  const filters = Object.keys(selector).map(attr => doc => {
    const attrSel = selector[attr]
    const conditions = Object.keys(attrSel).map($operator => doc => {
      const val = doc[attr]
      const selValue = attrSel[$operator]
      if ($operator == '$gt') {
        return val > selValue
      } else if ($operator == '$lt') {
        return val < selValue
      } else if ($operator == '$gte') {
        return val >= selValue
      } else if ($operator == '$lte') {
        return val <= selValue
      } else {
        throw new Error(`Unknown operator ${$operator}`)
      }
    })
    return and(conditions)(doc)
  })
  return docs.filter(and(filters))
}

const findNeighboringOperations = async (bill, options, allOperations) => {
  const queryOptions = getQueryOptions(bill, options, [])
  const neighboringOperations = findByMangoQuerySimple(
    allOperations,
    queryOptions
  )
  return neighboringOperations
}

module.exports = {
  findByMangoQuerySimple,
  findNeighboringOperations
}
