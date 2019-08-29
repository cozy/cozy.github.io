import React, { PureComponent } from 'react'
import SelectDates from 'components/SelectDates'
import { uniq, last } from 'lodash'
import {
  subMonths,
  format,
  parse,
  differenceInCalendarMonths,
  isAfter
} from 'date-fns'
import { getDate } from 'ducks/transactions/helpers'

const rangeMonth = (startDate, endDate) => {
  const options = []

  for (let i = 0; i < differenceInCalendarMonths(endDate, startDate) + 1; i++) {
    options.push(subMonths(endDate, i))
  }

  return options
}

const getYearMonth = transaction => getDate(transaction).slice(0, 7)

export const getOptions = transactions => {
  const availableMonths = uniq(transactions.map(getYearMonth)).sort()

  const mAvailableMonths = new Set(availableMonths)

  const start = parse(availableMonths[0], 'YYYY-MM')
  const lastMonth = parse(last(availableMonths), 'YYYY-MM')
  const today = new Date()
  const end = isAfter(lastMonth, today) ? lastMonth : today

  return rangeMonth(start, end).map(month => {
    const fmted = format(month, 'YYYY-MM')
    return {
      yearMonth: fmted,
      disabled: !mAvailableMonths.has(fmted)
    }
  })
}

class TransactionSelectDates extends PureComponent {
  render() {
    const { transactions, ...rest } = this.props
    const options = getOptions(transactions)

    return <SelectDates options={options} {...rest} />
  }
}

export default TransactionSelectDates
