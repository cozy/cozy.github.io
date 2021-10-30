const { addDays, addHours } = require('date-fns')
const { get } = require('lodash')

const DOCTYPE_GEOJSON_AGGREGATE = 'io.cozy.timeseries.geojson.aggregate'
const DOCTYPE_GEOJSON = 'io.cozy.timeseries.geojson'
const GEODOC = require('../../data/timeseries/geojson.json')

const N_DOCS = 1000

const createTrips = async client => {
  const trips = []
  for (let i = 0; i < N_DOCS; i++) {
    const startDate = addDays(new Date(2020, 1, 1), i)
    const endDate = addHours(startDate, 1)
    const trip = { ...GEODOC, startDate, endDate }
    trips.push(trip)
  }
  await client.collection(DOCTYPE_GEOJSON).updateAll(trips)
  return trips
}

const createAggregates = async (client, trips) => {
  const aggregates = trips.map(trip => {
    const distance = get(trip, 'series[0].properties.distance')
    const duration = get(trip, 'series[0].properties.duration')
    return {
      startDate: trip.startDate,
      endDate: trip.endDate,
      distance,
      duration
    }
  })
  await client.collection(DOCTYPE_GEOJSON_AGGREGATE).updateAll(aggregates)
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_GEOJSON, DOCTYPE_GEOJSON_AGGREGATE]
  },
  run: async function(ach) {
    const client = ach.client

    console.log(`Import ${N_DOCS} trips...`)
    const trips = await createTrips(client)

    console.log(`Aggregate ${N_DOCS} trips...`)
    await createAggregates(client, trips)

    console.log('Done!')
  }
}
