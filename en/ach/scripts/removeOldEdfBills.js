const { DOCTYPE_BANK_TRANSACTIONS, DOCTYPE_BILLS } = require('../libs/doctypes')
const mkAPI = require('./api')
let instance
let api

const isOldEdfBill = bill => bill.vendor === 'EDF'

const run = async (api, dryRun) => {
  const bills = (await api.fetchAll(DOCTYPE_BILLS)).filter(isOldEdfBill)
  console.log(`Will remove ${bills.length} EDF bills on ${instance}`)

  const operations = await api.fetchAll(DOCTYPE_BANK_TRANSACTIONS)

  removeBillsFromOperations(bills, operations, dryRun, instance)

  if (!dryRun) {
    await api.deleteAll(DOCTYPE_BILLS, bills)
  }
}

module.exports = {
  getDoctypes: () => [DOCTYPE_BILLS, DOCTYPE_BANK_TRANSACTIONS],
  run: async function(ach, dryRun = true) {
    instance = ach.url.replace('https://', '')
    return run((api = mkAPI(ach.oldClient)), dryRun).catch(err => {
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

async function removeBillsFromOperations(bills, operations, dryRun, instance) {
  const ops = operations.filter(op => op.bills || op.reimbursements)
  const batchTodo = []
  for (let op of ops) {
    let needUpdate = false
    let billsAttribute = op.bills ? cloneObj(op.bills) : []
    let reimbAttribute = op.reimbursements ? cloneObj(op.reimbursements) : []
    for (let bill of bills) {
      const billLongId = `io.cozy.bills:${bill._id}`
      // if bill id found in op bills, do something
      if (
        Array.isArray(billsAttribute) &&
        billsAttribute.indexOf(billLongId) >= 0
      ) {
        needUpdate = true
        billsAttribute = billsAttribute.filter(
          billId =>
            billId !== billLongId && billId !== `io.cozy.bills:${bill.original}`
        )
        if (bill.original) {
          billsAttribute.push(`io.cozy.bills:${bill.original}`)
        }
      }
      const foundReimb = reimbAttribute.filter(doc => doc.billId === billLongId)
      const foundOriginal = reimbAttribute.filter(
        doc => doc.billId === `io.cozy.bills:${bill.original}`
      )

      if (foundReimb.length) {
        needUpdate = true
      }
      if (foundReimb.length && foundOriginal.length) {
        // remove reimbursement
        reimbAttribute = reimbAttribute.filter(doc => doc.billId !== billLongId)
      } else if (foundReimb.length && !foundOriginal.length) {
        // replace reimbursement billId by originall billId
        reimbAttribute = reimbAttribute.map(doc => {
          if (doc.billId === billLongId) {
            doc.billId = `io.cozy.bills:${bill.original}`
          }
          return doc
        })
      }
    }
    if (needUpdate) {
      // favor bills in reimbursements over bills in bills attribute
      if (billsAttribute && billsAttribute.length) {
        const reimbBillIds = reimbAttribute
          ? reimbAttribute.map(doc => doc.billId)
          : []
        billsAttribute = billsAttribute
          ? billsAttribute.filter(bill => !reimbBillIds.includes(bill))
          : []
      }

      batchTodo.push({
        ...op,
        bills: billsAttribute,
        reimbursements: reimbAttribute
      })
    }
  }

  console.log(
    `Will update ${batchTodo.length} operations / ${operations.length} on ${instance}`
  )

  if (!dryRun && batchTodo.length) {
    console.log('Updating operations')
    await api.updateAll(DOCTYPE_BANK_TRANSACTIONS, batchTodo)
  }
}

function cloneObj(obj) {
  return JSON.parse(JSON.stringify(obj))
}
