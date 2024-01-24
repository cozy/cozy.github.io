const bluebird = require('bluebird')
const {
  findDebitOperation,
  findCreditOperation
} = require('./billsToOperation')
const defaults = require('lodash/defaults')
const defaultTo = require('lodash/defaultTo')
const groupBy = require('lodash/groupBy')
const flatten = require('lodash/flatten')
const sumBy = require('lodash/sumBy')
const omit = require('lodash/omit')
const max = require('lodash/max')
const geco = require('geco')
const format = require('date-fns/format')
const { getBillDate, log } = require('../utils')
const { Transaction, Bill } = require('models')

const DOCTYPE_OPERATIONS = 'io.cozy.bank.operations'
const DEFAULT_AMOUNT_DELTA = 0.001
export const DEFAULT_DATE_LOWER_DELTA = 15
export const DEFAULT_DATE_UPPER_DELTA = 29

const omitType = x => omit(x, '_type')

class Linker {
  constructor() {
    this.toUpdate = []
    this.groupVendors = ['Numéricable']
  }

  trackEvent() {
    return
  }

  async removeBillsFromOperations(bills, operations) {
    log('info', `Removing ${bills.length} bills from bank operations`)
    for (let op of operations) {
      let needUpdate = false
      let billsAttribute = op.bills || []
      for (let bill of bills) {
        const billLongId = `io.cozy.bills:${bill._id}`
        // if bill id found in op bills, do something
        if (billsAttribute.indexOf(billLongId) >= 0) {
          needUpdate = true
          billsAttribute = billsAttribute.filter(
            billId =>
              billId !== billLongId &&
              billId !== `io.cozy.bills:${bill.original}`
          )
          if (bill.original) {
            billsAttribute.push(`io.cozy.bills:${bill.original}`)
          }
        }
      }
      if (needUpdate) {
        log(
          'info',
          `Bank operation ${op._id}:  Replacing ${JSON.stringify(
            op.bills
          )} by ${JSON.stringify(billsAttribute)}`
        )
        await this.updateAttributes(DOCTYPE_OPERATIONS, op, {
          bills: billsAttribute
        })
      }
    }
  }

  /**
   * Get the sum of all bills amounts linked to a given transaction
   *
   * @param {Object} operation - An io.cozy.bank.operations document
   *
   * @returns {number}
   */
  async getBillsSum(operation) {
    if (!operation.bills) {
      return 0
    }

    const billIds = operation.bills.map(bill => bill.split(':')[1])
    const bills = await Bill.getAll(billIds)
    const sum = sumBy(bills.filter(Boolean), bill => bill.amount)

    return sum
  }

  /**
   * Check if summing a bill amount with the amounts of the bills linked to a
   * transaction overflows the amount of the transaction
   *
   * @param {Object} bill - An io.cozy.bills document
   * @param {Object} operation - An io.cozy.bank.operations document
   *
   * @param {boolean}
   */
  async isBillAmountOverflowingOperationAmount(bill, operation) {
    const currentBillsSum = await this.getBillsSum(operation)
    const newSum = currentBillsSum + bill.amount
    const isOverflowing = newSum > Math.abs(operation.amount)

    return isOverflowing
  }

  /**
   * Add a bill to an io.cozy.bank.operations' bills array
   *
   * @param {Object} bill - the io.cozy.bills to add
   * @param {Object} operation - the io.cozy.bank.operations to add the bill to
   *
   * @returns {boolean} true if the bill have been linked to the transaction, false otherwise
   */
  async addBillToOperation(bill, operation) {
    // TODO The method should throw if the bill can't be added.

    log('debug', `Adding bill ${bill._id} to operation ${operation._id}`)

    if (!bill._id) {
      log('warn', 'bill has no id, impossible to add it to an operation')
      return false
    }
    const billId = `io.cozy.bills:${bill._id}`
    if (operation.bills && operation.bills.indexOf(billId) > -1) {
      log(
        'warn',
        `Tried to add bill ${bill._id} to operation ${operation._id} but it's already linked`
      )
      return false
    }

    const isOverflowing = await this.isBillAmountOverflowingOperationAmount(
      bill,
      operation
    )

    if (isOverflowing) {
      log(
        'warn',
        `Impossible to match bill ${bill._id} with transation ${operation._id} because the linked bills amount would overflow the transaction amount`
      )
      return false
    }

    const billIds = operation.bills || []
    billIds.push(billId)
    const attributes = { bills: billIds }

    this.updateAttributes(DOCTYPE_OPERATIONS, operation, attributes)

    return true
  }

  /**
   * Add a bill to an io.cozy.bank.operations' reimbursements array
   *
   * @param {Object} bill - the io.cozy.bills to add
   * @param {Object} debitOperation - the io.cozy.bank.operations to add the bill to
   * @param {Object} matchingOperation - the io.cozy.bank.operations that is the corresponding credit operation
   */
  addReimbursementToOperation(bill, debitOperation, matchingOperation) {
    // TODO The method should throw if the bill can't be added

    log(
      'debug',
      `Adding bill ${bill._id} as a reimbursement to operation ${debitOperation._id}`
    )

    if (!bill._id) {
      log('warn', 'bill has no id, impossible to add it as a reimbursement')
      return Promise.resolve()
    }
    const billId = `io.cozy.bills:${bill._id}`
    if (
      debitOperation.reimbursements &&
      debitOperation.reimbursements.map(b => b.billId).indexOf(billId) > -1
    ) {
      log(
        'warn',
        `Tried to add bill ${bill._id} as a reimbursement to operation ${debitOperation._id} but it's already linked`
      )
      return Promise.resolve()
    }

    const reimbursements = debitOperation.reimbursements || []

    reimbursements.push({
      billId,
      amount: bill.amount,
      operationId: matchingOperation && matchingOperation._id
    })

    return this.updateAttributes(DOCTYPE_OPERATIONS, debitOperation, {
      reimbursements: reimbursements
    })
  }

  /**
   * Buffer update operations
   *
   * @param {string} doctype - The type of the document that is going to be updated
   * @param {Object} doc - The document that is going to be updated
   * @param {Object} attrs - The updates to apply
   */
  updateAttributes(doctype, doc, attrs) {
    Object.assign(doc, attrs)
    this.toUpdate.push(doc)
    return Promise.resolve()
  }

  /*
   * Commit updates
   */
  commitChanges() {
    log(
      'debug',
      `linkBankOperations: commiting ${this.toUpdate.length} changes`
    )
    return Transaction.updateAll(this.toUpdate.map(omitType))
  }

  /**
   * Get defaulted options
   *
   * @param {Object} [opts={}]
   * @param {number} [opts.amountLowerDelta=0.001]
   * @param {number} [opts.amountUpperDelta=0.001]
   * @param {number} [opts.dateLowerDelta=15]
   * @param {number} [opts.dateUpperDelta=29]
   */
  getOptions(opts = {}) {
    const options = { ...opts }

    // TODO Use the same names as the bills matchingCriterias
    defaults(options, { amountDelta: DEFAULT_AMOUNT_DELTA })
    defaults(options, {
      amountLowerDelta: defaultTo(
        options.amountLowerDelta,
        DEFAULT_AMOUNT_DELTA
      ),
      amountUpperDelta: defaultTo(
        options.amountUpperDelta,
        DEFAULT_AMOUNT_DELTA
      ),
      dateLowerDelta: defaultTo(
        options.dateLowerDelta,
        DEFAULT_DATE_LOWER_DELTA
      ),
      dateUpperDelta: defaultTo(
        options.dateUpperDelta,
        DEFAULT_DATE_UPPER_DELTA
      )
    })

    return options
  }
  /**
   * Find a credit transaction for a bill
   *
   * @param {Object} bill - an io.cozy.bills document
   * @param {Object} debitOperation - an io.cozy.bank.operations that already matched with the given io.cozy.bills as a debit transaction
   * @param {Object[]} allOperations - an array of io.cozy.bank.operations documents
   * @param {Object} options - see getOptions
   *
   * @returns {(Object|null)} The io.cozy.bank.operations that matched or null if nothing matched
   */
  async linkBillToCreditOperation(
    bill,
    debitOperation,
    allOperations,
    options,
    brands
  ) {
    const creditOperation = await findCreditOperation(
      bill,
      options,
      allOperations,
      brands
    )

    const promises = []
    if (creditOperation) {
      log(
        'debug',
        `Found credit operation ${creditOperation._id} for bill ${bill._id}`
      )
      promises.push(this.addBillToOperation(bill, creditOperation))
    } else {
      log('debug', `Can't find credit operation for bill ${bill._id}`)
    }

    // TODO Extract this from this function, this is not its role to also add
    // the reimbursement
    if (creditOperation && debitOperation) {
      promises.push(
        this.addReimbursementToOperation(bill, debitOperation, creditOperation)
      )
    }

    await Promise.all(promises)

    return creditOperation
  }

  /**
   * Find a debit transaction for a bill
   *
   * @param {Object} bill - an io.cozy.bills document
   * @param {Object[]} allOperations - an array of io.cozy.bank.operations documents
   * @param {Object} options - see getOptions
   * @param {object[]} brands - Brands dictionary
   *
   * @returns {(Object|false)} The io.cozy.bank.operations that matched or false
   */
  async linkBillToDebitOperation(bill, allOperations, options, brands) {
    // eslint-disable-next-line
    return findDebitOperation(bill, options, allOperations, brands).then(operation => {
        // eslint-disable-next-line
      if (operation) {
          log(
            'debug',
            `Found debit operation ${operation._id} for bill ${bill._id}`
          )
          // eslint-disable-next-line
        return this.addBillToOperation(bill, operation).then(
            addResult => addResult && operation
          )
        } else {
          log('debug', `Can't find debit operation for bill ${bill._id}`)
        }
      }
    )
  }

  /**
   * Link bills to
   *   - their matching banking operation (debit)
   *   - to their reimbursement (credit)
   *
   * @param {Object[]} bills - The array of io.cozy.bills to match
   * @param {Object[]} operations - The array of io.cozy.bank.operations to match
   * @param {Object} options - The options to apply to the matching algorithm
   * @param {number} options.amountLowerDelta - Lower delta for amount window
   * @param {number} options.amountUpperDelta - Upper delta for amount window
   * @param {number} options.dateLowerDelta - Lower delta for date window
   * @param {number} options.dateUpperDelta - Upper delta for date window
   * @param {object[]} brands - Brands dictionary
   *
   * @returns {Object} An object that contains matchings for each bill
   *
   * @see https://docs.cozy.io/en/cozy-doctypes/docs/io.cozy.bills/
   * @see https://docs.cozy.io/en/cozy-doctypes/docs/io.cozy.bank/#iocozybankoperations
   */
  async linkBillsToOperations(bills, operations, options, brands) {
    const optionsToUse = this.getOptions(options)
    const result = {}

    let allOperations = operations

    if (!allOperations) {
      log(
        'info',
        'No operations given to linkBillsToOperations, fetching all operations.'
      )
      allOperations = await Transaction.fetchAll()
    }

    log(
      'debug',
      `Trying to find matchings between ${bills.length} bills and ${allOperations.length} operations`
    )

    if (optionsToUse.billsToRemove && optionsToUse.billsToRemove.length) {
      this.removeBillsFromOperations(optionsToUse.billsToRemove, allOperations)
    }

    // when bill comes from a third party payer,
    // no transaction is visible on the bank account
    const filteredBills = bills.filter(bill => !bill.isThirdPartyPayer === true)

    await bluebird.each(filteredBills, async bill => {
      const res = (result[bill._id] = { bill: bill })

      // the bills combination phase is very time consuming. We can avoid it when we run the
      // connector in standalone mode
      if (allOperations.length === 0) {
        log('info', `No operations to match against bill ${bill._id}`)
        return result
      }

      const debitOperation = await this.linkBillToDebitOperation(
        bill,
        allOperations,
        optionsToUse,
        brands
      )

      if (debitOperation) {
        res.debitOperation = debitOperation
      }

      if (bill.isRefund) {
        const creditOperation = await this.linkBillToCreditOperation(
          bill,
          debitOperation,
          allOperations,
          optionsToUse,
          brands
        )

        if (creditOperation) {
          res.creditOperation = creditOperation
        }
      }
    })

    await this.findCombinations(result, optionsToUse, allOperations)
    await this.commitChanges()

    return result
  }

  /**
   * Combine bills to find debit transaction to the ones that didn't matched
   * alone
   *
   * @param {Object} result - The result of the previous alone matching phase
   * @param {Object} options - see getOptions
   * @param {Object[]} allOperations - An array of io.cozy.bank.operations documents
   */
  async findCombinations(result, options, allOperations) {
    log('debug', 'finding combinations')
    let found

    do {
      found = false

      // TODO Filter bills upfront so `result` param is not necessary
      const unlinkedBills = this.getUnlinkedBills(result)
      log(
        'debug',
        `findCombinations: There are ${unlinkedBills.length} unlinked bills`
      )
      const billsGroups = this.groupBills(unlinkedBills)

      log('debug', `findCombinations: Groups: ${billsGroups.length}`)
      const combinations = flatten(
        billsGroups.map(billsGroup =>
          this.generateBillsCombinations(billsGroup)
        )
      )

      log('debug', `Generated ${combinations.length} bills combinations`)

      const combinedBills = combinations.map(combination =>
        this.combineBills(combination)
      )

      for (const combinedBill of combinedBills) {
        const debitOperation = await findDebitOperation(
          combinedBill,
          options,
          allOperations
        )

        if (debitOperation) {
          found = true
          log('debug', combinedBill, 'Matching bills combination')
          log('debug', debitOperation, 'Matching debit debitOperation')

          combinedBill.originalBills.forEach(async originalBill => {
            const res = result[originalBill._id]
            res.debitOperation = debitOperation

            if (res.creditOperation && res.debitOperation) {
              await this.addReimbursementToOperation(
                originalBill,
                debitOperation,
                res.creditOperation
              )
            }
          })

          break
        }
      }
    } while (found)

    return result
  }

  /**
   * Get bills that didn't matched with a debit transaction
   *
   * @param {Object} bills - The result of `linkBillsToOperations`
   *
   * @return {Object[]} An array of io.cozy.bills
   */
  getUnlinkedBills(bills) {
    const unlinkedBills = Object.values(bills)
      .filter(bill => !bill.debitOperation)
      .map(bill => bill.bill)

    return unlinkedBills
  }

  /**
   * Tell if a bill can be part of a group or not
   *
   * @param {Object} bill - An io.cozy.bills document
   *
   * @return {boolean}
   */
  billCanBeGrouped(bill) {
    return (
      getBillDate(bill) &&
      (bill.type === 'health_costs' || this.groupVendors.includes(bill.vendor))
    )
  }

  /**
   * Group given bills
   *
   * @param {Object[]} bills - An array of io.cozy.bills documents
   *
   * @return {Object[][]} Array of groups
   */
  groupBills(bills) {
    const billsToGroup = bills.filter(bill => this.billCanBeGrouped(bill))
    const groups = groupBy(billsToGroup, bill => {
      return [format(getBillDate(bill), 'YYYY-MM-DD'), bill.vendor]
    })

    return Object.values(groups)
  }

  /**
   * Generate all possible combination of a given bills group
   *
   * @param {Object[]} bills - An array of io.cozy.bills documents
   *
   * @return {Object[][]} An array of possible combinations
   */
  generateBillsCombinations(bills) {
    const MIN_ITEMS_IN_COMBINATION = 2
    const combinations = []

    for (let n = MIN_ITEMS_IN_COMBINATION; n <= bills.length; ++n) {
      const combinationsN = geco.gen(bills.length, n, bills)
      combinations.push(...combinationsN)
    }

    return combinations
  }

  /**
   * Combine an array of bills in a single meta bill
   *
   * @param {Object[]} bills - An array of io.cozy.bills documents
   *
   * @return {Object} A « meta » io.cozy.bills document
   */
  combineBills(bills) {
    return {
      ...bills[0],
      _id: ['combined', ...bills.map(bill => bill._id)].join(':'),
      amount: sumBy(bills, bill => bill.amount),
      originalAmount: sumBy(bills, bill => bill.originalAmount),
      originalBills: bills,
      matchingCriterias: this.mergeMatchingCriterias(bills)
    }
  }

  /**
   * Merge multiple bills matching criterias by making an union of them.
   * In the end, we keep the widest range for each criterias
   *
   * @param {Object[]} bills - An array of io.cozy.bills documents
   *
   * @return {Object} The merged matching criterias
   */
  mergeMatchingCriterias(bills) {
    const defaultCriterias = {
      amountLowerDelta: DEFAULT_AMOUNT_DELTA,
      amountUpperDelta: DEFAULT_AMOUNT_DELTA,
      dateLowerDelta: DEFAULT_DATE_LOWER_DELTA,
      dateUpperDelta: DEFAULT_DATE_UPPER_DELTA
    }

    const matchingCriterias = bills.reduce((criterias, bill) => {
      const billCriterias = {
        ...defaultCriterias,
        ...bill.matchingCriterias
      }

      if (billCriterias.labelRegex) {
        criterias.labelRegex = [
          ...(criterias.labelRegex || []),
          billCriterias.labelRegex
        ]
      }

      const criteriasNames = [
        'amountLowerDelta',
        'amountUpperDelta',
        'dateLowerDelta',
        'dateUpperDelta'
      ]

      for (const criteriaName of criteriasNames) {
        criterias[criteriaName] = max([
          billCriterias[criteriaName],
          criterias[criteriaName]
        ])
      }

      return criterias
    }, {})

    if (matchingCriterias.labelRegex) {
      matchingCriterias.labelRegex =
        '(' + matchingCriterias.labelRegex.join('|') + ')'
    }

    return matchingCriterias
  }
}

export default Linker
