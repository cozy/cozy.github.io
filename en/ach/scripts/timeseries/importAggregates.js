const { get } = require('lodash')

const { createTrips } = require('./importGeojson')
const {
  DOCTYPE_GEOJSON_AGGREGATE,
  DOCTYPE_GEOJSON
} = require('../../libs/doctypes')

const createAggregates = trips => {
  return trips.map(trip => {
    const distance = get(trip, 'series[0].properties.distance')
    const duration = get(trip, 'series[0].properties.duration')

    return {
      startDate: trip.startDate,
      endDate: trip.endDate,
      distance,
      duration
    }
  })
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_GEOJSON, DOCTYPE_GEOJSON_AGGREGATE]
  },
  run: async function(ach) {
    const client = ach.client
    const trips = createTrips()

    console.log(`Aggregate ${trips.length} trips...`)
    const aggregates = createAggregates(trips)
    await client.collection(DOCTYPE_GEOJSON_AGGREGATE).updateAll(aggregates)

    console.log('Done!')
  }
}
