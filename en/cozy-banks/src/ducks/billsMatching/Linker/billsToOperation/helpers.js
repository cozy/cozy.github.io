const sortBy = require('lodash/sortBy')
const get = require('lodash/get')
const addDays = require('date-fns/add_days')
const subDays = require('date-fns/sub_days')
const differenceInDays = require('date-fns/difference_in_days')

const getOperationAmountFromBill = (bill, options) => {
  const searchingCredit = options && options.credit
  return searchingCredit
    ? bill.groupAmount || bill.amount
    : -(bill.originalAmount || bill.amount)
}

const getOperationDateFromBill = (bill, options) => {
  const isCredit = options && options.credit
  const date = isCredit ? bill.date : bill.originalDate || bill.date
  return date ? new Date(date) : new Date()
}

const getIdentifiers = options => options.identifiers

const getDateRangeFromBill = (bill, options) => {
  const date = getOperationDateFromBill(bill, options)

  const lowerDelta = get(
    bill,
    'matchingCriterias.dateLowerDelta',
    options.dateLowerDelta
  )

  const upperDelta = get(
    bill,
    'matchingCriterias.dateUpperDelta',
    options.dateUpperDelta
  )

  return {
    minDate: subDays(date, lowerDelta),
    maxDate: addDays(date, upperDelta)
  }
}

const getAmountRangeFromBill = (bill, options) => {
  const amount = getOperationAmountFromBill(bill, options)

  const lowerDelta = get(
    bill,
    'matchingCriterias.amountLowerDelta',
    options.amountLowerDelta
  )

  const upperDelta = get(
    bill,
    'matchingCriterias.amountUpperDelta',
    options.amountUpperDelta
  )

  return {
    minAmount: amount - lowerDelta,
    maxAmount: amount + upperDelta
  }
}

const getTotalReimbursements = operation => {
  if (!operation.reimbursements) return 0

  return operation.reimbursements.reduce((s, r) => s + r.amount, 0)
}

// when we want to match an invoice with an operation according criteria,
// it is possible that several operations are returned to us.
// So we want to find the bill that comes closest.
// This function will sort this list
const sortedOperations = (bill, operations) => {
  const buildSortFunction = bill => {
    // it's not possible to sort with 2 parameters as the same time
    // Date is more important so it have a biggest weight,
    // but this value is random.
    const dateWeight = 0.7
    const amountWeight = 1 - dateWeight

    const opDate = getOperationDateFromBill(bill)
    const opAmount = getOperationAmountFromBill(bill)

    return operation => {
      const dateDiff = Math.abs(differenceInDays(opDate, operation.date))
      const amountDiff = Math.abs(opAmount - operation.amount)

      return dateWeight * dateDiff + amountWeight * amountDiff
    }
  }

  return sortBy(operations, buildSortFunction(bill))
}

const getBillRegexp = (bill, brands) => {
  let regexpStr = bill.matchingCriterias && bill.matchingCriterias.labelRegex

  if (!regexpStr && bill.vendor) {
    const [brand] = brands.filter(
      brand => brand.name === bill.vendor || brand.konnectorSlug === bill.vendor
    )
    regexpStr = brand ? brand.regexp : `\\b${bill.vendor}\\b`
  }

  if (!regexpStr) {
    return null
  }

  return new RegExp(regexpStr, 'i')
}

module.exports = {
  getOperationAmountFromBill,
  getOperationDateFromBill,
  getIdentifiers,
  getDateRangeFromBill,
  getAmountRangeFromBill,
  getTotalReimbursements,
  sortedOperations,
  getBillRegexp
}
