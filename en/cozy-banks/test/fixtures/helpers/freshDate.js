const demoFixtures = require('../demo.json')
const last = require('lodash/last')
const differenceInDays = require('date-fns/difference_in_days')
const addDays = require('date-fns/add_days')

const getMostRecentDate = dates => {
  const sorted = dates.sort()
  return new Date(last(sorted))
}

const stripHelperCall = str =>
  str.replace(/{{ freshDate '(.*)' }}/g, (_, date) => date)

const getDemoFixtures = () => demoFixtures['io.cozy.bank.operations']

const allDates = getDemoFixtures().map(tr => stripHelperCall(tr.date))
const mostRecentDate = getMostRecentDate(allDates)
const today = new Date()
const difference = differenceInDays(today, mostRecentDate)

const freshDate = originalDate => {
  const newDate = addDays(originalDate, difference)
  return newDate.toISOString()
}

module.exports = {
  getMostRecentDate,
  stripHelperCall,
  freshDate
}
