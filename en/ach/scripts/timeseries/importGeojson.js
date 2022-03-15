const { isEqual, uniqWith, cloneDeep } = require('lodash')

const GEODOC01 = require('../../data/timeseries/geojson-01.json')
const GEODOC02 = require('../../data/timeseries/geojson-02.json')
const GEODOC03 = require('../../data/timeseries/geojson-03.json')
const STREETS = require('../../data/timeseries/streetsOfLyon.json')
const {
  'io.cozy.accounts': ACCOUNTS
} = require('../../data/accounts/tracemob.json')

const DOCTYPE_GEOJSON_AGGREGATE = 'io.cozy.timeseries.geojson.aggregate'
const DOCTYPE_GEOJSON = 'io.cozy.timeseries.geojson'

const GEODOCS = [GEODOC01, GEODOC02, GEODOC03]
const N_DOCS = 75

const allModes = [
  'AIR_OR_HSR',
  'BICYCLING',
  'BUS',
  'CAR',
  'SUBWAY',
  'TRAIN',
  'WALKING',
  'UNKNOWN'
]

const arrayHasSameValue = arr => {
  return uniqWith(arr, isEqual).length === 1
}

const getRandomValueFromArray = (arr, exclude) => {
  const randIdx = Math.floor(Math.random() * arr.length)
  const selectedValue =
    exclude && isEqual(exclude, arr[randIdx]) && !arrayHasSameValue(arr)
      ? getRandomValueFromArray(arr, exclude)
      : arr[randIdx]

  return selectedValue
}

const createTrips = () => {
  const trips = []

  for (let i = 0; i < N_DOCS; i++) {
    const randomDoc = cloneDeep(getRandomValueFromArray(GEODOCS))
    const cozyMetadata = { sourceAccount: ACCOUNTS[0]._id }

    randomDoc.series[0].features.forEach(featColl => {
      if (featColl.type === 'FeatureCollection') {
        const mode = getRandomValueFromArray(allModes)
        featColl.features[0].properties.sensed_mode = `PredictedModeTypes.${mode}`
      }
    })

    const startName = getRandomValueFromArray(STREETS)
    const endName = getRandomValueFromArray(STREETS)

    randomDoc.series[0].features[0].properties.display_name = startName
    randomDoc.series[0].features[1].properties.display_name = endName

    const trip = { ...randomDoc, cozyMetadata }
    trips.push(trip)
  }

  return trips
}

module.exports = {
  arrayHasSameValue,
  getRandomValueFromArray,
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
