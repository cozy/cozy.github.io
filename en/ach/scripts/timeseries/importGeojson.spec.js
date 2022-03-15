const {
  createTrips,
  arrayHasSameValue,
  getRandomValueFromArray
} = require('./importGeojson')

const arrwithoutSameValues = [
  { one: 0, two: [{ val: 'a' }] },
  { one: 0, two: [{ val: 'b' }] }
]
const arrwithSameValues = [
  { one: 0, two: [{ val: 'a' }] },
  { one: 0, two: [{ val: 'a' }] }
]

describe('importGeojson', () => {
  describe('createTrips', () => {
    it('should return array of timeseries', () => {
      const res = createTrips()

      expect(res[0]).toHaveProperty('series')
      expect(res[0]).toHaveProperty('startDate')
      expect(res[0]).toHaveProperty('endDate')
      expect(res[0]).toHaveProperty('cozyMetadata')
      expect(res[0]).toHaveProperty('source')
    })
    it('should return array of 75 timeseries', () => {
      const res = createTrips()

      expect(res).toHaveLength(75)
    })
  })

  describe('arrayHasSameValue', () => {
    it('should return "false" if array has not same values', () => {
      const res = arrayHasSameValue(arrwithoutSameValues)

      expect(res).toBe(false)
    })
    it('should return "true" if array has same values', () => {
      const res = arrayHasSameValue(arrwithSameValues)

      expect(res).toBe(true)
    })
  })

  describe('getRandomValueFromArray', () => {
    it('should return "undefined" if array parameter is empty & exclude parameter is undefined', () => {
      const res = getRandomValueFromArray([])

      expect(res).toBeUndefined()
    })
    it('should return "undefined" if array parameter is empty & exclude parameter is defined', () => {
      const res = getRandomValueFromArray([], 1)

      expect(res).toBeUndefined()
    })
    it('should return one value', () => {
      const res = getRandomValueFromArray(arrwithoutSameValues)

      expect(res).toBeDefined()
      expect(res).toHaveProperty('one', 0)
    })
    it('should return a value that is not the excluded one', () => {
      const res = getRandomValueFromArray(
        arrwithoutSameValues,
        arrwithoutSameValues[1]
      )

      expect(res).toBeDefined()
      expect(res).toHaveProperty('two', [{ val: 'a' }])
    })
    it('should return a value that is not the excluded one, unless all values are equal', () => {
      const res = getRandomValueFromArray(
        arrwithSameValues,
        arrwithSameValues[1]
      )

      expect(res).toBeDefined()
      expect(res).toHaveProperty('two', [{ val: 'a' }])
    })
  })
})
