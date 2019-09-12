/**
 * Compiles the templates with helpers and partials
 */

const Handlebars = require('handlebars')
const layouts = require('handlebars-layouts')
const { parse, format } = require('date-fns')
const { getCategoryId } = require('ducks/categories/helpers')
const { getAccountBalance } = require('ducks/account/helpers')
const { getParentCategory } = require('ducks/categories/categoriesMap')
const utils = require('../utils')

const capitalizeWord = str => {
  if (str.length > 3) {
    return str[0].toUpperCase() + str.slice(1).toLowerCase()
  } else {
    return str
  }
}

const embeds = {
  // eslint-disable-next-line import/no-webpack-loader-syntax
  'style.css': require('!!raw-loader!ducks/notifications/html/templates/style.css')
    .default
}

Handlebars.registerHelper({
  colored: amount => {
    return new Handlebars.SafeString(
      `<span class='amount amount${amount > 0 ? 'Pos' : 'Neg'}'>
${amount >= 0 ? '+' : '-'}
${Math.abs(amount)} €
</span>
`
    )
  },

  parentCategory: function(transaction) {
    return getParentCategory(getCategoryId(transaction))
  },

  embedFile: filename => {
    return embeds[filename]
  },

  get: (a1, a2, a3) => {
    return a1[a2][a3]
  },

  capitalize: str => {
    return str
      .split(' ')
      .map(capitalizeWord)
      .join(' ')
  },

  formatDate: (date, fmt, ctx) => {
    if (ctx === undefined) {
      ctx = fmt
      fmt = 'DD/MM/YYYY'
    }
    if (date.getDay) {
      return format(date, fmt)
    } else {
      const parsed = parse(date.substr(0, 10), 'YYYY-MM-DD')
      return format(parsed, fmt)
    }
  },

  eachPair: function(context, options) {
    let ret = ''

    for (let i = 0, j = context.length; i < j; i++) {
      ret = ret + options.fn(context[i], { blockParams: context[i] })
    }

    return ret
  },

  positive: function(n) {
    return n > 0
  },

  treatedByFormat: utils.treatedByFormat,

  getAccountBalance
})

layouts.register(Handlebars)

const partials = {
  'bank-layout': Handlebars.compile(
    require('ducks/notifications/html/templates/bank-layout.hbs').default
  ),
  'cozy-layout': Handlebars.compile(
    require('ducks/notifications/html/templates/cozy-layout.hbs').default
  ),
  'balance-lower': Handlebars.compile(
    require('ducks/notifications/html/templates/balance-lower.hbs').default
  ),
  'transaction-greater': Handlebars.compile(
    require('ducks/notifications/html/templates/transaction-greater.hbs')
      .default
  ),
  'health-bill-linked': Handlebars.compile(
    require('ducks/notifications/html/templates/health-bill-linked.hbs').default
  ),
  'late-health-reimbursement': Handlebars.compile(
    require('ducks/notifications/html/templates/late-health-reimbursement.hbs')
      .default
  ),
  'delayed-debit': Handlebars.compile(
    require('ducks/notifications/html/templates/delayed-debit.hbs').default
  )
}

Handlebars.registerPartial(partials)

module.exports = Handlebars.partials
