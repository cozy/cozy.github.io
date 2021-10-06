import fixtures from 'test/fixtures'
import { nextDate, makeRecurrenceFromTransaction } from './utils'
import MockDate from 'mockdate'

test('make recurrence from transaction', () => {
  const transaction = fixtures['io.cozy.bank.operations'][0]
  const recurrence = makeRecurrenceFromTransaction(transaction)
  expect(recurrence).toEqual({
    _type: 'io.cozy.bank.recurrence',
    accounts: ['compteisa1'],
    amounts: [-1231],
    automaticLabel: 'Remboursement Pret Lcl',
    categoryIds: ['401010'],
    latestDate: '2017-08-25T00:00:00Z',
    latestAmount: -1231,
    stats: {
      deltas: {
        median: 30
      }
    }
  })
})

describe('nextDate', () => {
  beforeEach(() => {
    // We are in August
    MockDate.set(new Date('2019-08-01'))
  })

  afterEach(() => {
    MockDate.reset()
  })

  it('should compute the next date in the future of the recurrence', () => {
    // Latest date of the currence is in June
    const recurrence = fixtures['io.cozy.bank.recurrence'][0]
    const date = nextDate(recurrence)

    // Even though a recurrence transaction is missing in July, we compute
    // a date in august since we are now in August
    expect(date.toISOString()).toEqual('2019-08-25T00:00:00.000Z')
  })
})
