const sumBy = require('lodash/sumBy')
const isWithinRange = require('date-fns/is_within_range')
const { log } = require('../../utils')
const { getCategoryId } = require('../../../transactions/helpers')

const {
  getDateRangeFromBill,
  getAmountRangeFromBill,
  getBillRegexp
} = require('./helpers')

// constants
const HEALTH_EXPENSE_CAT = '400610'
const HEALTH_INSURANCE_CAT = '400620'
const UNCATEGORIZED_CAT_ID_OPERATION = '0' // TODO: import it from cozy-bank

// helpers

const isHealthOperation = operation => {
  const catId = getCategoryId(operation)
  if (operation.amount < 0) {
    return catId === HEALTH_EXPENSE_CAT
  } else {
    return catId === HEALTH_EXPENSE_CAT || catId === HEALTH_INSURANCE_CAT
  }
}

const isUncategorizedOperation = operation => {
  const catId = getCategoryId(operation)
  return catId == UNCATEGORIZED_CAT_ID_OPERATION
}

const isHealthBill = bill => {
  return bill.type === 'health_costs'
}

// filters
const filterByBrand = (bill, brands) => {
  const regexp = getBillRegexp(bill, brands)

  const brandFilter = operation => {
    if (!regexp) {
      return false
    }

    const label = operation.label.toLowerCase()
    return Boolean(label.match(regexp))
  }

  brandFilter.name = 'byBrand'

  return brandFilter
}

const filterByDates = ({ minDate, maxDate }) => {
  const dateFilter = operation => {
    const operationDate = operation.realisationDate || operation.date
    return isWithinRange(operationDate, minDate, maxDate)
  }

  dateFilter.name = 'byDates'

  return dateFilter
}

const filterByAmounts = ({ minAmount, maxAmount }) => {
  const amountFilter = operation => {
    return operation.amount >= minAmount && operation.amount <= maxAmount
  }

  amountFilter.name = 'byAmounts'

  return amountFilter
}

const filterByCategory = (bill, options = {}) => {
  const isHealth = isHealthBill(bill)
  const categoryFilter = operation => {
    if (
      options.allowUncategorized === true &&
      isUncategorizedOperation(operation)
    ) {
      return true
    }
    return isHealth
      ? isHealthOperation(operation)
      : !isHealthOperation(operation)
  }

  categoryFilter.name = 'byCategory'
  return categoryFilter
}

/**
 * Check that the sum of the reimbursements + the amount of the bill is not
 * greater that the amount of the operation
 */
const filterByReimbursements = bill => {
  const reimbursementFilter = operation => {
    const sumReimbursements = sumBy(operation.reimbursements, 'amount')
    return sumReimbursements + bill.amount <= -operation.amount
  }

  reimbursementFilter.name = 'byReimbursements'
  return reimbursementFilter
}

// combine filters

const operationsFilters = (bill, operations, options, brands) => {
  const filterByConditions = filters => op => {
    for (let f of filters) {
      const res = f(op)
      if (!res) {
        log('debug', `Operation ${op._id} does not satisfy ${f.name} filter`)
        return false
      }

      log('debug', `Operation ${op._id} satisfies ${f.name} filter`)
    }
    return true
  }

  const fByDates = filterByDates(getDateRangeFromBill(bill, options))
  const fByAmounts = filterByAmounts(getAmountRangeFromBill(bill, options))
  const fByCategory = filterByCategory(bill, options)
  const fByReimbursements = filterByReimbursements(bill, options)

  const conditions = [fByDates, fByAmounts, fByCategory]
  if (!options.credit) {
    conditions.push(fByReimbursements)
  }

  // We filters with brand when
  // - we search a credit operation
  // - or when bill is not in the health category
  if (options.credit || !isHealthBill(bill)) {
    const fbyBrand = filterByBrand(bill, brands)
    conditions.push(fbyBrand)
  }

  return operations.filter(filterByConditions(conditions))
}

module.exports = {
  filterByBrand,
  filterByDates,
  filterByAmounts,
  filterByCategory,
  filterByReimbursements,
  operationsFilters
}
