/**
 * Compiles the templates with helpers and partials
 */

import Handlebars from 'handlebars'
import { parse, format } from 'date-fns'

import { getCategoryId } from 'ducks/transactions/helpers'
import { getAccountBalance } from 'ducks/account/helpers'
import { getParentCategory } from 'ducks/categories/categoriesMap'
import { treatedByFormat } from 'ducks/notifications/helpers'

const capitalizeWord = str => {
  if (str.length > 3) {
    return str[0].toUpperCase() + str.slice(1).toLowerCase()
  } else {
    return str
  }
}

export const helpers = {
  colored: amount => {
    return new Handlebars.SafeString(
      `<span class='amount amount${amount > 0 ? 'Pos' : 'Neg'}'>
${amount >= 0 ? '+' : '-'}
${Math.abs(amount)} €
</span>
`
    )
  },

  categoryIcon: categoryId => {
    const parentCategoryName = getParentCategory(categoryId)
    return new Handlebars.SafeString(
      `<img style="width: 32px; height: 32px" src='https://downcloud.cozycloud.cc/upload/cozy-banks/email-assets/icons/icon-cat-${parentCategoryName}.png' />`
    )
  },

  parentCategory: function (transaction) {
    return getParentCategory(getCategoryId(transaction))
  },

  get: (a1, a2, a3) => {
    return a1[a2][a3]
  },

  capitalize: str => {
    return str.split(' ').map(capitalizeWord).join(' ')
  },

  formatDate: (date, fmt, ctx) => {
    let ctxToUse = ctx
    let fmtToUse = fmt
    if (ctxToUse === undefined) {
      ctxToUse = fmt
      fmtToUse = 'DD/MM/YYYY'
    }
    if (date.getDay) {
      return format(date, fmtToUse)
    } else {
      const parsed = parse(date.substr(0, 10), 'YYYY-MM-DD')
      return format(parsed, fmtToUse)
    }
  },

  eachPair: function (context, options) {
    let ret = ''

    for (let i = 0, j = context.length; i < j; i++) {
      ret = ret + options.fn(context[i], { blockParams: context[i] })
    }

    return ret
  },

  positive: function (n) {
    return n > 0
  },

  treatedByFormat,

  getAccountBalance
}
