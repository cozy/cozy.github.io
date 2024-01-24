import Linker, {
  DEFAULT_DATE_LOWER_DELTA,
  DEFAULT_DATE_UPPER_DELTA
} from './Linker/Linker'
import { format as formatDate } from 'date-fns'
import { Transaction } from 'models'
import { getDateRangeFromBill } from './Linker/billsToOperation/helpers'

const DATE_FORMAT = 'YYYY-MM-DD'

export default async function matchFromBills(bills, brands) {
  const options = {
    dateLowerDelta: DEFAULT_DATE_LOWER_DELTA,
    dateUpperDelta: DEFAULT_DATE_UPPER_DELTA
  }

  const dateRange = bills.reduce((range, bill) => {
    const billRange = getDateRangeFromBill(bill, options)

    if (billRange.minDate < range.minDate) {
      range.minDate = billRange.minDate
    }

    if (billRange.maxDate > range.maxDate) {
      range.maxDate = billRange.maxDate
    }

    return range
  }, getDateRangeFromBill(bills[0], options))

  const selector = {
    date: {
      $gt: formatDate(dateRange.minDate, DATE_FORMAT),
      $lt: formatDate(dateRange.maxDate, DATE_FORMAT)
    }
  }

  const transactions = await Transaction.queryAll(selector)

  const linker = new Linker()
  const results = await linker.linkBillsToOperations(
    bills,
    transactions,
    undefined,
    brands
  )

  return results
}
