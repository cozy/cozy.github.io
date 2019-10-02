/*
 * This script finds bills and reimbursements in bank operations which do not exist anymore
 * If any and if not in dry run, their reference will be removed from operations
 */

const mkAPI = require('./api')

const DOCTYPE_BILLS = 'io.cozy.bills'
const DOCTYPE_OPERATIONS = 'io.cozy.bank.operations'

const keyBy = require('lodash/keyBy')

function findOperationsToUpdate(bills, ops) {
  const billsIndex = keyBy(bills, bill => bill._id)
  const operations = ops.filter(op => op.bills || op.reimbursements)

  function findExisingBills(bills) {
    if (bills) {
      return bills.filter(
        bill => bill.includes(':') && billsIndex[bill.split(':').pop()]
      )
    } else return []
  }

  function findExisingReimbursements(bills) {
    if (bills) {
      return bills.filter(
        bill =>
          bill.billId.includes(':') && billsIndex[bill.billId.split(':').pop()]
      )
    } else return []
  }

  let totalBills = 0
  let totalReimbursements = 0
  let countMissingBills = 0
  let countMissingReimbursements = 0
  const opToUpdate = []
  for (const op of operations) {
    let needsUpdate = false
    const newOp = { ...op }
    if (op.bills && op.bills.length) {
      totalBills += op.bills.length
      const existingBills = findExisingBills(op.bills)
      const diff = op.bills.length - existingBills.length
      if (diff > 0) {
        countMissingBills += diff
        console.log(newOp, 'before bills')
        newOp.bills = existingBills
        console.log(newOp, 'after bills')
        needsUpdate = true
      }
    }
    if (op.reimbursements && op.reimbursements.length) {
      totalReimbursements += op.reimbursements.length
      const existingReimbursements = findExisingReimbursements(
        op.reimbursements
      )
      const diff = op.reimbursements.length - existingReimbursements.length
      if (diff > 0) {
        countMissingReimbursements += diff
        console.log(newOp, 'before reimbursements')
        newOp.reimbursements = existingReimbursements
        console.log(newOp, 'after reimbursements')
        needsUpdate = true
      }
    }
    if (needsUpdate) {
      opToUpdate.push(newOp)
    }
  }

  return {
    opToUpdate,
    totalBills,
    totalReimbursements,
    countMissingBills,
    countMissingReimbursements
  }
}

const run = async (api, dryRun) => {
  const bills = await api.fetchAll(DOCTYPE_BILLS)
  const operations = await api.fetchAll(DOCTYPE_OPERATIONS)

  const {
    opToUpdate,
    totalBills,
    totalReimbursements,
    countMissingBills,
    countMissingReimbursements
  } = findOperationsToUpdate(bills, operations)

  console.log(`${countMissingBills}/${totalBills} bills to remove`)
  console.log(
    `${countMissingReimbursements}/${totalReimbursements} reimbursements to remove`
  )
  console.log(`${opToUpdate.length} operations to update`)

  if (!dryRun && opToUpdate.length) {
    console.log('Updating operations...')
    await api.updateAll(DOCTYPE_OPERATIONS, opToUpdate)
    console.log('  done')
  }
}

module.exports = {
  getDoctypes: () => [DOCTYPE_BILLS, DOCTYPE_OPERATIONS],
  findOperationsToUpdate,
  run: async function(ach, dryRun = true) {
    return run(mkAPI(ach.client), dryRun).catch(err => {
      console.error(err)
      return {
        error: {
          message: err.message,
          stack: err.stack
        }
      }
    })
  }
}
