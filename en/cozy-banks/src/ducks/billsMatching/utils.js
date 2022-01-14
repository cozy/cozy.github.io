/**
 * This module proposes some small utils regarding connectors
 *
 * Parameters:
 *
 * * `documents`: an array of objects corresponding to the data you want to save in the cozy
 * * `doctype` (string): the doctype where you want to save data (ex: 'io.cozy.bills')
 * * `options` :
 *    - `keys` (array) : List of keys used to check that two items are the same. By default it is set to `['id']'.
 *    - `index` (optionnal) : Return value returned by `cozy.data.defineIndex`, the default will correspond to all documents of the selected doctype.
 *    - `selector` (optionnal object) : Mango request to get records. Default is built from the keys `{selector: {_id: {"$gt": null}}}` to get all the records.
 *
 * ```javascript
 * const documents = [
 *   {
 *     name: 'toto',
 *     height: 1.8
 *   },
 *   {
 *     name: 'titi',
 *     height: 1.7
 *   }
 * ]
 *
 * return filterData(documents, 'io.cozy.height', {
 *   keys: ['name']
 * }).then(filteredDocuments => addData(filteredDocuments, 'io.cozy.height'))
 *
 * ```
 *
 * @module filterData
 */
const logger = require('cozy-logger')
const keyBy = require('lodash/keyBy')
const sortBy = require('lodash/sortBy')

const log = logger.namespace('billsmatching-utils')

const sortBillsByLinkedOperationNumber = (bills, operations) => {
  const billsToUse = bills.map(bill => {
    bill.opNb = 0
    return bill
  })
  const billsIndex = keyBy(billsToUse, '_id')
  if (operations)
    operations.forEach(op => {
      if (op.bills)
        op.bills.forEach(billId => {
          const bill = billsIndex[billId]
          if (bill) bill.opNb++
        })
    })
  const sorted = sortBy(Object.values(billsIndex), 'opNb').reverse()
  return sorted
}

const getBillDate = bill => bill.originalDate || bill.date

const logResult = matchingResult => {
  Object.entries(matchingResult).forEach(([key, value]) => {
    if (value.debitOperation) {
      log(
        'info',
        `Bill ${key} matched with transaction ${value.debitOperation._id} (debit)`
      )
    }

    if (value.creditOperation) {
      log(
        'info',
        `Bill ${key} matched with transaction ${value.creditOperation._id} (credit)`
      )
    }
  })
}

const formatOperationLog = operation =>
  `${operation._id} (${operation.date} - ${operation.amount} - ${operation.label})`

const formatBillLog = bill =>
  `${bill._id} (${bill.date} - ${bill.amount} - ${bill.vendor})`

module.exports = {
  sortBillsByLinkedOperationNumber,
  getBillDate,
  logResult,
  log: require('cozy-logger').namespace('bills-matching'),
  formatOperationLog,
  formatBillLog
}
