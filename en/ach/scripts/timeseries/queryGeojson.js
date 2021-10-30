const { Q } = require('cozy-client')

const DOCTYPE_GEOJSON = 'io.cozy.timeseries.geojson'
const DOCTYPE_GEOJSON_AGGREGATE = 'io.cozy.timeseries.geojson.aggregate'

const queryTrips = async (client, { fields } = {}) => {
  const query = Q(DOCTYPE_GEOJSON)
    .where({
      startDate: {
        $gt: null
      }
    })
    .sortBy([{ startDate: 'desc' }])
    .indexFields(['startDate'])
    .limitBy(100)
  if (fields) {
    query.fields = fields
  }
  const { data: trips } = await client.query(query)
  return trips
}

const queryTripsAggregate = async (client, { fields } = {}) => {
  const query = Q(DOCTYPE_GEOJSON_AGGREGATE)
    .where({
      startDate: {
        $gt: null
      }
    })
    .sortBy([{ startDate: 'asc' }])
    .indexFields(['startDate'])
    .limitBy(100)
  if (fields) {
    query.fields = fields
  }
  const { data: aggregates } = await client.query(query)
  return aggregates
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_GEOJSON, DOCTYPE_GEOJSON_AGGREGATE]
  },
  run: async function(ach) {
    const client = ach.client

    console.time('Query full trips')
    await queryTrips(client)
    console.timeEnd('Query full trips')

    console.time('Query reduced trips')
    await queryTrips(client, { fields: ['startDate', 'endDate'] })
    console.timeEnd('Query reduced trips')

    console.time('Query trips aggregate')
    await queryTripsAggregate(client)
    console.timeEnd('Query trips aggregate')

    console.time('Query reduced trips aggregate')
    await queryTripsAggregate(client, { fields: ['startDate', 'endDate'] })
    console.timeEnd('Query reduced trips aggregate')
  }
}
