const { addDays, addHours } = require('date-fns')

const DOCTYPE_GEOJSON_AGGREGATE = 'io.cozy.timeseries.geojson.aggregate'
const DOCTYPE_GEOJSON = 'io.cozy.timeseries.geojson'
const GEODOC01 = require('../../data/timeseries/geojson-01.json')
const GEODOC02 = require('../../data/timeseries/geojson-02.json')
const GEODOC03 = require('../../data/timeseries/geojson-03.json')
const {
  'io.cozy.accounts': ACCOUNTS
} = require('../../data/accounts/tracemob.json')
const GEODOCS = [GEODOC01, GEODOC02, GEODOC03]

const N_DOCS = 75

const createTrips = () => {
  const trips = []
  for (let i = 0; i < N_DOCS; i++) {
    const randomDoc = GEODOCS[Math.floor(Math.random() * GEODOCS.length)]
    const startDate = addDays(new Date(2020, 1, 1), i)
    const endDate = addHours(startDate, 1)
    const cozyMetadata = { sourceAccount: ACCOUNTS[0]._id }
    const trip = { ...randomDoc, startDate, endDate, cozyMetadata }
    trips.push(trip)
  }
  return trips
}

module.exports = {
  createTrips,
  getDoctypes: function() {
    return [DOCTYPE_GEOJSON, DOCTYPE_GEOJSON_AGGREGATE]
  },
  run: async function(ach) {
    const client = ach.client
    const trips = createTrips()

    console.log(`Import ${trips.length} trips...`)
    await client.collection(DOCTYPE_GEOJSON).updateAll(trips)

    console.log('Done!')
  }
}
