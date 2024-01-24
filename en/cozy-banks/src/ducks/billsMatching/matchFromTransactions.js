import min from 'lodash/min'
import max from 'lodash/max'
import { format as formatDate, addYears, subYears } from 'date-fns'
import { Bill } from 'models'
import Linker from './Linker/Linker'

export default async function matchFromTransactions(transactions, brands) {
  const transactionsDates = transactions.map(transaction => transaction.date)
  const dateMin = subYears(min(transactionsDates), 1)
  const dateMax = addYears(max(transactionsDates), 1)

  const selector = {
    date: {
      $gt: formatDate(dateMin, 'YYYY-MM-DD'),
      $lt: formatDate(dateMax, 'YYYY-MM-DD')
    }
  }

  const bills = await Bill.queryAll(selector)

  const linker = new Linker()
  const results = await linker.linkBillsToOperations(
    bills,
    transactions,
    undefined,
    brands
  )

  return results
}
