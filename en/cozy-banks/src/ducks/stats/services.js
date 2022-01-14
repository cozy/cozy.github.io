import moment from 'moment-timezone'
import { BankTransaction } from 'cozy-doctypes'
import sumBy from 'lodash/sumBy'

moment.tz.setDefault('Europe/Paris')

export const getPeriod = () => {
  const end = moment().startOf('month')

  const start = end.clone().subtract(3, 'month').startOf('month')

  return { start, end }
}

export const fetchTransactionsForPeriod = period => {
  return BankTransaction.queryAll({
    date: {
      $gte: period.start,
      $lt: period.end
    }
  })
}

export const getMeanOnPeriod = (transactions, period) => {
  const end = moment(period.end)
  const start = moment(period.start)

  const nbMonths = end.diff(start, 'months')

  const total = Math.abs(sumBy(transactions, transaction => transaction.amount))
  const mean = total / nbMonths

  return mean
}
