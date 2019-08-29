import {
  getPeriod,
  fetchTransactionsForPeriod,
  getMeanOnPeriod
} from './services'
import MockDate from 'mockdate'
import { BankTransaction } from 'cozy-doctypes'
import moment from 'moment-timezone'

moment.tz.setDefault('Europe/Paris')

jest.mock('cozy-doctypes')

describe('getPeriod', () => {
  afterEach(() => {
    MockDate.reset()
  })

  it('should return the period', () => {
    MockDate.set(new Date('2019-07-08T00:00:00.000Z'))

    const period = getPeriod()

    expect(period).toMatchSnapshot()
  })
})

describe('fetchTransactionsForPeriod', () => {
  it('should fetch transactions for the given period', async () => {
    const period = {
      start: moment('2019-04-01'),
      end: moment('2019-07-01')
    }

    await fetchTransactionsForPeriod(period)

    expect(BankTransaction.queryAll).toHaveBeenCalledWith({
      date: {
        $gte: period.start,
        $lt: period.end
      }
    })
  })
})

describe('getMeanOnPeriod', () => {
  const period = {
    start: moment('2019-04-01'),
    end: moment('2019-07-01')
  }

  it('should return the mean amount by month on the given period', () => {
    const transactions = [{ amount: 100 }, { amount: 50 }]

    expect(getMeanOnPeriod(transactions, period)).toBe(50)
  })

  it('should return a positive value even if transactions amount is negative', () => {
    const transactions = [{ amount: -100 }, { amount: -50 }]

    expect(getMeanOnPeriod(transactions, period)).toBe(50)
  })
})
