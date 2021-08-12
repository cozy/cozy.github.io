import React from 'react'
import { render } from '@testing-library/react'
import fixtures from 'test/fixtures'
import addMonths from 'date-fns/add_months'
import isBefore from 'date-fns/is_before'
import isEqual from 'date-fns/is_equal'
import format from 'date-fns/format'
import includes from 'lodash/includes'
import MockDate from 'mockdate'

import TransactionSelectDates, { getOptions } from './TransactionSelectDates'
import { createMockClient } from 'cozy-client'
import { TRANSACTION_DOCTYPE } from 'doctypes'
import AppLike from 'test/AppLike'
import { findSelectDatesInput } from 'test/selectDates'
import getClient from 'selectors/getClient'
import useTransactionExtent from 'hooks/useTransactionExtent'

jest.mock('hooks/useTransactionExtent', () => jest.fn())
jest.mock('selectors/getClient', () => jest.fn())

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

describe('TransactionSelectDates', () => {
  afterEach(() => {
    MockDate.reset()
  })

  it('should render if earliest/latest transaction do not exist', () => {
    MockDate.set(new Date('2019-06-01'))

    const client = createMockClient({
      queries: {
        transactions: {
          doctype: TRANSACTION_DOCTYPE,
          data: []
        }
      }
    })

    useTransactionExtent.mockReturnValue([undefined, undefined, false])
    getClient.mockReturnValue(client)
    const onExtentLoad = jest.fn()
    const root = render(
      <AppLike client={client}>
        <TransactionSelectDates
          onExtentLoad={onExtentLoad}
          options={getOptions(transactions)}
          onChange={jest.fn()}
        />
      </AppLike>
    )

    expect(findSelectDatesInput(root).map(n => n.textContent)).toEqual([
      '2019',
      'June'
    ])
    expect(onExtentLoad).toHaveBeenCalledWith([])
  })

  it('should render if earliest/latest transaction do exist', () => {
    MockDate.set(new Date('2019-06-01'))

    const client = createMockClient({
      queries: {
        transactions: {
          doctype: TRANSACTION_DOCTYPE,
          data: []
        }
      }
    })

    useTransactionExtent.mockReturnValue([
      transactions[0],
      transactions[transactions.length - 1],
      false
    ])
    getClient.mockReturnValue(client)
    const onExtentLoad = jest.fn()
    const root = render(
      <AppLike client={client}>
        <TransactionSelectDates
          onExtentLoad={onExtentLoad}
          options={getOptions(transactions)}
          onChange={jest.fn()}
        />
      </AppLike>
    )

    expect(findSelectDatesInput(root).map(n => n.textContent)).toEqual([
      '2019',
      'June'
    ])
    expect(onExtentLoad).toHaveBeenCalledWith(['2017-08', '2018-06'])
  })
})
