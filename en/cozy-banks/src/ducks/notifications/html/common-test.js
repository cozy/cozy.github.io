const fs = require('fs')
const Handlebars = require('handlebars').default
const Notification = require('../Notification').default
const { getAccountNewBalance } = require('../helpers')

const readJSONSync = filename => {
  return JSON.parse(fs.readFileSync(filename))
}

export const EMAILS = {
  balanceLower: {
    template: require('./balance-lower-html').default,
    data: readJSONSync('src/ducks/notifications/html/data/balance-lower.json')
  },

  healthBillLinked: {
    template: require('./health-bill-linked-html').default,
    data: readJSONSync(
      'src/ducks/notifications/html/data/health-bill-linked.json'
    )
  },

  transactionGreater: {
    template: require('./transaction-greater-html').default,
    data: readJSONSync(
      'src/ducks/notifications/html/data/transactions-greater.json'
    )
  },

  lateHealthReimbursement: {
    template: require('./late-health-reimbursement-html').default,
    data: readJSONSync(
      'src/ducks/notifications/html/data/late-health-reimbursement.json'
    )
  },

  delayedDebit: {
    template: require('./delayed-debit-html').default,
    data: readJSONSync('src/ducks/notifications/html/data/delayed-debit.json')
  }
}

export const renderTemplate = (templateName, lang) => {
  const localeStrings = require(`../../../locales/${lang}`)
  const { initTranslation } = require('cozy-ui/react/I18n/translation')
  const translation = initTranslation(lang, () => localeStrings)
  const t = translation.t.bind(translation)
  Handlebars.registerHelper({
    tGlobal: key => t('Notifications.email.' + key),
    t,
    getAccountNewBalance
  })
  const data = EMAILS[templateName].data
  const tpl = EMAILS[templateName].template
  const cozyURL = 'https://test.mycozy.cloud'
  const urls = Notification.generateURLs(cozyURL)
  const allData = { ...data, urls }
  return tpl(allData)
}
