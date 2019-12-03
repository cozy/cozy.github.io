import {
  filterTransactionsByAccount,
  getBalanceHistory,
  getBalanceHistories,
  sumBalanceHistories,
  getAllDates,
  balanceHistoryToChartData,
  getPanelsState
} from './helpers'
import { format as formatDate, parse as parseDate } from 'date-fns'

describe('filterTransactionsByAccount', () => {
  describe('With included relationship', () => {
    it('should return transactions of a particular account', () => {
      const transactions = [
        { account: { data: { _id: '1' } } },
        { account: { data: { _id: '2' } } },
        { account: { data: { _id: '1' } } },
        { account: { data: { _id: '3' } } },
        { account: { data: { _id: '4' } } },
        { account: { data: { _id: '1' } } },
        { account: { data: { _id: '5' } } }
      ]

      expect(filterTransactionsByAccount('1', transactions)).toEqual([
        transactions[0],
        transactions[2],
        transactions[5]
      ])
    })
  })

  describe('Without included relationship', () => {
    it('should return transactions of a particular account', () => {
      const transactions = [
        { account: '1' },
        { account: '2' },
        { account: '1' },
        { account: '3' },
        { account: '4' },
        { account: '1' },
        { account: '5' }
      ]

      expect(filterTransactionsByAccount('1', transactions)).toEqual([
        transactions[0],
        transactions[2],
        transactions[5]
      ])
    })
  })
})

describe('getBalanceHistory', () => {
  it('should return only the latest balance if there is no transaction and from is not specified', () => {
    const account = { _id: 'test', balance: 8000 }
    const transactions = []
    const to = new Date()
    const date = formatDate(to, 'YYYY-MM-DD')
    const history = getBalanceHistory(account, transactions, to)

    expect(Object.keys(history)).toEqual([date])
    expect(history[date]).toBe(8000)
  })

  it('should return the same balance for all dates if there is no transaction and from is specified', () => {
    const account = { _id: 'test', balance: 8000 }
    const transactions = []
    const to = parseDate('2018-06-26')
    const from = parseDate('2018-06-24')
    const history = getBalanceHistory(account, transactions, to, from)

    expect(history).toEqual({
      '2018-06-26': 8000,
      '2018-06-25': 8000,
      '2018-06-24': 8000
    })
  })

  it('should return history from the earliest transaction date if from is not specified', () => {
    const account = { _id: 'test', balance: 7985 }
    const transactions = [
      { date: '2018-06-25T00:00:00Z', amount: 100 },
      { date: '2018-06-24T00:00:00Z', amount: 10 },
      { date: '2018-06-23T00:00:00Z', amount: -300 },
      { date: '2018-06-22T00:00:00Z', amount: -15 },
      // date should be taken into account as it is the effective debit date
      {
        date: '2018-06-26T00:00:00Z',
        realisationDate: '2018-06-01T00:00:00Z',
        amount: -15
      }
    ]
    const to = parseDate('2018-06-27')
    const history = getBalanceHistory(account, transactions, to)

    expect(history).toEqual({
      '2018-06-27': 7985,
      '2018-06-26': 8000,
      '2018-06-25': 7900,
      '2018-06-24': 7890,
      '2018-06-23': 8190,
      '2018-06-22': 8205
    })
  })

  it('should return history from the specified date if from is specified', () => {
    const account = { _id: 'test', balance: 8000 }
    const transactions = [
      { date: '2018-06-25T00:00:00Z', amount: 100 },
      { date: '2018-06-24T00:00:00Z', amount: 10 },
      { date: '2018-06-23T00:00:00Z', amount: -300 },
      { date: '2018-06-22T00:00:00Z', amount: -15 }
    ]
    const to = parseDate('2018-06-26')
    const from = parseDate('2018-06-24')
    const history = getBalanceHistory(account, transactions, to, from)

    expect(history).toEqual({
      '2018-06-26': 8000,
      '2018-06-25': 7900,
      '2018-06-24': 7890
    })
  })
})

describe('getAllDates', () => {
  it('should return all the unique dates for a given set of balance histories', () => {
    const histories = [
      { '2018-11-22': 8000, '2018-11-21': 9000 },
      { '2018-11-22': 5000 },
      { '2018-11-22': 1000, '2018-11-21': 500, '2018-11-20': 600 }
    ]

    const expected = ['2018-11-22', '2018-11-21', '2018-11-20']
    const result = getAllDates(histories)

    expect(result).toEqual(expected)
  })
})

describe('sumBalanceHistories', () => {
  it('should return a single balance history that is the sum of histories in params', () => {
    const histories = [
      { '2018-11-22': 8000, '2018-11-21': 9000 },
      { '2018-11-22': 5000 },
      { '2018-11-22': 1000, '2018-11-21': 500, '2018-11-20': 600 }
    ]

    const expected = {
      '2018-11-22': 14000,
      '2018-11-21': 9500,
      '2018-11-20': 600
    }

    const result = sumBalanceHistories(histories)

    expect(result).toEqual(expected)
  })
})

describe('getBalanceHistories', () => {
  it('should an empty history if there is no account', () => {
    expect(
      getBalanceHistories(
        [],
        [],
        parseDate('2019-01-02'),
        parseDate('2019-01-01')
      )
    ).toEqual({
      __no_accounts__: {
        '2019-01-01': 0,
        '2019-01-02': 0
      }
    })
  })

  it('should return an object with a property for each account id', () => {
    const accounts = [
      { _id: 'acc1', balance: 8000 },
      { _id: 'acc2', balance: 5000 },
      { _id: 'acc3', balance: 2000 }
    ]

    const transactions = []
    const to = parseDate('2018-06-26')
    const histories = getBalanceHistories(accounts, transactions, to)

    expect(Object.keys(histories)).toEqual(['acc1', 'acc2', 'acc3'])
  })

  it('should return the right histories if there is no transaction', () => {
    const accounts = [
      { _id: 'acc1', balance: 8000 },
      { _id: 'acc2', balance: 5000 },
      { _id: 'acc3', balance: 2000 }
    ]

    const transactions = []

    const to = parseDate('2018-06-26')
    const from = parseDate('2018-06-24')

    const histories = getBalanceHistories(accounts, transactions, to, from)

    expect(histories['acc1']).toEqual({
      '2018-06-26': 8000,
      '2018-06-25': 8000,
      '2018-06-24': 8000
    })

    expect(histories['acc2']).toEqual({
      '2018-06-26': 5000,
      '2018-06-25': 5000,
      '2018-06-24': 5000
    })

    expect(histories['acc3']).toEqual({
      '2018-06-26': 2000,
      '2018-06-25': 2000,
      '2018-06-24': 2000
    })
  })

  it('should return the right histories if there is transactions', () => {
    const accounts = [
      { _id: 'acc1', balance: 8000 },
      { _id: 'acc2', balance: 1000 }
    ]

    const transactions = [
      { account: 'acc1', amount: -1000, date: '2018-11-21' },
      { account: 'acc2', amount: 1000, date: '2018-11-20' }
    ]

    const to = parseDate('2018-11-22')
    const from = parseDate('2018-11-20')

    const histories = getBalanceHistories(accounts, transactions, to, from)

    expect(histories['acc1']).toEqual({
      '2018-11-22': 8000,
      '2018-11-21': 9000,
      '2018-11-20': 9000
    })

    expect(histories['acc2']).toEqual({
      '2018-11-22': 1000,
      '2018-11-21': 1000,
      '2018-11-20': 0
    })
  })
})

describe('balanceHistoryToChartData', () => {
  it('should sort by date desc', () => {
    const history = { '2018-11-22': 1000, '2018-11-21': 500, '2018-11-20': 600 }
    const expected = ['2018-11-20', '2018-11-21', '2018-11-22']
    const chartData = balanceHistoryToChartData(history)
    const dates = chartData.map(item => formatDate(item.x, 'YYYY-MM-DD'))

    expect(dates).toEqual(expected)
  })

  it('should return the right data', () => {
    const history = { '2018-11-22': 1000, '2018-11-21': 500, '2018-11-20': 600 }
    const expected = [600, 500, 1000]
    const chartData = balanceHistoryToChartData(history)
    const values = chartData.map(item => item.y)

    expect(values).toEqual(expected)
  })
})

describe('getPanelsState', () => {
  it('should initialize switches state to true', () => {
    const groups = [{ _id: 'g1', accounts: { data: [{ _id: 'a1' }] } }]
    const currentSwitchesState = {}

    expect(getPanelsState(groups, currentSwitchesState)).toEqual({
      g1: {
        checked: true,
        expanded: true,
        accounts: {
          a1: {
            checked: true,
            disabled: false
          }
        }
      }
    })
  })

  it('should disable an account if its group is unchecked', () => {
    const groups = [{ _id: 'g1', accounts: { data: [{ _id: 'a1' }] } }]
    const currentSwitchesState = {
      g1: {
        checked: false
      }
    }

    expect(getPanelsState(groups, currentSwitchesState)).toEqual({
      g1: {
        checked: false,
        expanded: true,
        accounts: {
          a1: {
            checked: true,
            disabled: true
          }
        }
      }
    })
  })
})
