const { getMostRecentDate, stripHelperCall } = require('./freshDate')

describe('getMostRecentDate', () => {
  it('should return the most recent date', () => {
    const dates = [
      '2018-08-06T00:00:00Z',
      '2018-09-06T00:00:00Z',
      '2018-10-06T00:00:00Z',
      '2019-01-06T00:00:00Z',
      '2019-02-06T00:00:00Z',
      '2018-12-06T00:00:00Z',
      '2018-11-06T00:00:00Z'
    ]

    expect(getMostRecentDate(dates)).toEqual(new Date('2019-02-06T00:00:00Z'))
  })
})

describe('stripHelperCall', () => {
  it('should strip the handlebars helper call to return just the date argument', () => {
    const str = "{{ freshDate '2019-02-22T00:00:00Z' }}"
    expect(stripHelperCall(str)).toBe('2019-02-22T00:00:00Z')
  })
})
