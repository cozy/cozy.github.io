import fixtures from 'test/fixtures'
import { nextDate, makeRecurrenceFromTransaction } from './utils'

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
    stats: {
      deltas: {
        median: 30
      }
    }
  })
})

test('nextDate', () => {
  const recurrence = fixtures['io.cozy.bank.recurrence'][0]
  const date = nextDate(recurrence)
  expect(date.toISOString()).toEqual('2018-07-01T00:00:00.000Z')
})
