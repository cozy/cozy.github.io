import { getOptions } from './TransactionSelectDates'
import fixtures from 'test/fixtures'
import addMonths from 'date-fns/add_months'
import isBefore from 'date-fns/is_before'
import isEqual from 'date-fns/is_equal'
import format from 'date-fns/format'
import includes from 'lodash/includes'
import MockDate from 'mockdate'

const transactions = fixtures['io.cozy.bank.operations']

const enabledMonth = ['2018-06', '2018-01', '2017-08', '2017-07', '2017-06']

const generateOption = date => {
  const month = format(date, 'YYYY-MM')
  return {
    disabled: !includes(enabledMonth, month),
    yearMonth: month
  }
}

const generateOptions = (startDate, endDate) => {
  const options = []
  let currentDate = startDate
  while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
    options.push(generateOption(currentDate))
    currentDate = addMonths(currentDate, 1)
  }

  return options.reverse()
}

describe('options from select dates', () => {
  afterEach(() => {
    MockDate.reset()
  })

  it('should compute correctly', () => {
    expect(getOptions(transactions)).toEqual(
      generateOptions(new Date('2017-06-01'), new Date())
    )
  })

  it('should compute correctly with transactions in the future', () => {
    MockDate.set(new Date('2019-06-01'))

    const transactionInFuture = {
      _id: 'inthefuture',
      date: format(addMonths(new Date(), 1), 'YYYY-MM-DD')
    }

    enabledMonth.unshift(transactionInFuture.date.slice(0, 7))

    expect(getOptions([...transactions, transactionInFuture])).toEqual(
      generateOptions(
        new Date('2017-06-01'),
        new Date(transactionInFuture.date)
      )
    )
  })
})
