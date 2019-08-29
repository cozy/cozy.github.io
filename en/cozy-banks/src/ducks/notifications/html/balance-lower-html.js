const { groupBy, map } = require('lodash')
const templates = require('./templates')
const { renderMJML, getCurrentDate } = require('./utils')

const groupAccountsByInstitution = accounts => {
  return map(groupBy(accounts, 'institutionLabel'), (accounts, name) => ({
    name,
    accounts
  }))
}

export default ({ accounts, urls }) => {
  const data = {
    institutions: groupAccountsByInstitution(accounts),
    date: getCurrentDate(),
    ...urls
  }

  return renderMJML(templates['balance-lower'](data))
}
