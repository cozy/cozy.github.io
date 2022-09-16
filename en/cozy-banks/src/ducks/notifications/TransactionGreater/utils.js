import { getCurrencySymbol } from 'utils/currencySymbol'
import capitalize from 'lodash/capitalize'
import { toText } from 'cozy-notifications'

import { formatAmount } from 'ducks/notifications/helpers'

const ACCOUNT_SEL = '.js-account'
const DATE_SEL = '.js-date'
const TRANSACTION_SEL = '.js-transaction'

export const MAX_CHAR_BY_LINE = 50
const SEPARATOR = ' : '

const capitalizeEachWords = str => str.split(' ').map(capitalize).join(' ')

export const formatTransaction = (transaction, censoring) => {
  const { amount, currency } = transaction
  const amountFormat = `${formatAmount(amount, censoring)}${getCurrencySymbol(
    currency
  )}`
  const REMAINS_LENGTH =
    MAX_CHAR_BY_LINE - SEPARATOR.length - amountFormat.length
  const labelCapitalize = capitalizeEachWords(transaction.label)
  const transactionName = labelCapitalize.substr(0, REMAINS_LENGTH)
  return `${transactionName}${SEPARATOR}${amountFormat}`
}

// TODO add tests
export const customToText = cozyHTMLEmail => {
  const getTextTransactionRow = $row =>
    $row
      .find('td')
      .map((i, td) => $row.find(td).text().trim())
      .toArray()
      .join(' ')
      .replace(/\n/g, '')
      .replace(' €', '€')
      .trim()

  const getContent = $ =>
    $([ACCOUNT_SEL, DATE_SEL, TRANSACTION_SEL].join(', '))
      .toArray()
      .map(node => {
        const $node = $(node)
        if ($node.is(ACCOUNT_SEL)) {
          return '\n\n### ' + $node.text()
        } else if ($node.is(DATE_SEL)) {
          return '\n' + $node.text() + '\n'
        } else if ($node.is(TRANSACTION_SEL)) {
          return '- ' + getTextTransactionRow($node)
        }
      })
      .join('\n')
  return toText(cozyHTMLEmail, getContent)
}
