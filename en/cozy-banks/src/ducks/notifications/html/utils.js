import cheerio from 'cheerio'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import toPairs from 'lodash/toPairs'
import flow from 'lodash/flow'
import unique from 'lodash/uniq'
import get from 'lodash/get'
import { getDate } from 'ducks/transactions/helpers'
import { mjml2html } from 'mjml'

export const toText = (cozyHTMLEmail, getContent) => {
  const $ = cheerio.load(cozyHTMLEmail)
  const title = $('.header__title')
    .text()
    .trim()
  const descTitle = $('.header__desc__title')
    .text()
    .trim()
  const descSubtitle = $('.header__desc__subtitle')
    .text()
    .trim()
  return `
# Cozy - ${title}
## ${descTitle} - ${descSubtitle}

---------
${getContent($)}
`
}

export const prepareTransactions = function(transactions) {
  const byAccounts = groupBy(transactions, tr => tr.account)

  const groupAndSortByDate = flow(
    transactions => groupBy(transactions, getDate),
    toPairs,
    dt => sortBy(dt, ([date]) => date).reverse()
  )
  Object.keys(byAccounts).forEach(account => {
    byAccounts[account] = groupAndSortByDate(byAccounts[account])
  })

  return byAccounts
}

const billIdFromReimbursement = reimbursement => {
  return reimbursement.billId && reimbursement.billId.split(':')[1]
}

export const treatedByFormat = function(reimbursements, billsById) {
  return unique(
    (reimbursements || [])
      .map(reimbursement => {
        const billId = billIdFromReimbursement(reimbursement)
        return get(billsById, billId + '.vendor')
      })
      .filter(x => x && x !== '')
  ).join(', ')
}

export const renderMJML = mjmlContent => {
  const obj = mjml2html(mjmlContent)
  obj.errors.forEach(err => {
    // eslint-disable-next-line no-console
    console.warn(err.formattedMessage)
  })

  if (obj.html) {
    return obj.html
  } else {
    throw new Error('Error during HTML generation')
  }
}

export const getCurrentDate = () => {
  return new Date()
}
