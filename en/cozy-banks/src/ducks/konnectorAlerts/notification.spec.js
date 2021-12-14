import { getScheduleDate } from './notification'

describe('getScheduleDate', () => {
  it('should return a date the same day if before 5', () => {
    const date = new Date(2020, 0, 1, 4, 15)
    const scheduled = getScheduleDate(date)

    expect(scheduled.getHours()).toBe(5)
    expect(scheduled.getFullYear()).toBe(2020)
    expect(scheduled.getMonth()).toBe(0)
    expect(scheduled.getDate()).toBe(1)
  })

  it('should return a date the next day if past 5', () => {
    const date = new Date(2020, 0, 1, 7, 15)
    const scheduled = getScheduleDate(date)

    expect(scheduled.getHours()).toBe(5)
    const minutes = scheduled.getMinutes()
    expect(minutes >= 0 && minutes < 16).toBe(true)
    expect(scheduled.getFullYear()).toBe(2020)
    expect(scheduled.getMonth()).toBe(0)
    expect(scheduled.getDate()).toBe(2)
  })
})
