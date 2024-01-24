const { operationsFilters } = require('./operationsFilters')
const { findNeighboringOperations } = require('./findNeighboringOperations')
const { sortedOperations } = require('./helpers')
const { log, formatOperationLog, formatBillLog } = require('../../utils')

const findOperation = (bill, options, allOperations, brands) => {
  // By default, a bill is an expense. If it is not, it should be
  // declared as a refund: isRefund=true.
  if (options.credit && !bill.isRefund) return
  return findNeighboringOperations(bill, options, allOperations).then(
    operations => {
      log(
        'debug',
        `Found ${
          operations.length
        } neighboring operations for bill ${formatBillLog(bill)}`
      )

      operations.forEach(operation => {
        log('debug', formatOperationLog(operation))
      })

      let filteredOperations = operationsFilters(
        bill,
        operations,
        options,
        brands
      )

      log(
        'debug',
        `${
          filteredOperations.length
        } operations left after filtering for bill ${formatBillLog(bill)}`
      )

      filteredOperations.forEach(operation => {
        log('debug', formatOperationLog(operation))
      })

      filteredOperations = sortedOperations(bill, filteredOperations)

      const selectedOperation = filteredOperations[0]

      if (selectedOperation) {
        log(
          'debug',
          `Selected operation ${formatOperationLog(
            selectedOperation
          )} for bill ${formatBillLog(bill)}`
        )
      }

      return selectedOperation
    }
  )
}

const findDebitOperation = (bill, options, allOperations, brands) => {
  log('debug', `Finding debit operation for bill ${bill._id}`)
  return findOperation(bill, options, allOperations, brands)
}
const findCreditOperation = (bill, options, allOperations, brands) => {
  log('debug', `Finding credit operation for bill ${bill._id}`)
  const creditOptions = Object.assign({}, options, { credit: true })
  return findOperation(bill, creditOptions, allOperations, brands)
}

module.exports = {
  findDebitOperation,
  findCreditOperation
}
