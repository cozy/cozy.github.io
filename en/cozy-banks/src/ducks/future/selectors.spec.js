import { STATUS_ONGOING, STATUS_FINISHED } from 'ducks/recurrence/api'
import { isDeprecatedBundle } from './selectors.js'

const now = Date.now()
const threeMonthsAgo = new Date(now)
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
const fiveMonthsAgo = new Date(now)
fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5)

describe('isDeprecatedBundle', () => {
  it('should consider inactive or finished recurrences as deprecated', () => {
    const recurrences = [
      {
        latestDate: threeMonthsAgo.toISOString(),
        status: STATUS_ONGOING
      },
      {
        latestDate: fiveMonthsAgo.toISOString(),
        status: STATUS_ONGOING
      },
      {
        latestDate: threeMonthsAgo.toISOString(),
        status: STATUS_FINISHED
      },
      {
        latestDate: fiveMonthsAgo.toISOString(),
        status: STATUS_FINISHED
      }
    ]
    expect(isDeprecatedBundle(recurrences[0])).toBe(false)
    expect(isDeprecatedBundle(recurrences[1])).toBe(true)
    expect(isDeprecatedBundle(recurrences[2])).toBe(true)
    expect(isDeprecatedBundle(recurrences[3])).toBe(true)
  })
})
