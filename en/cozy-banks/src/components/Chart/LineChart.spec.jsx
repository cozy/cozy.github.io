import LineChart from './LineChart'

const chartData = [
  { x: new Date('2018-07-03'), y: 3 },
  { x: new Date('2018-07-02'), y: 4 },
  { x: new Date('2018-07-01'), y: 5 },
  { x: new Date('2018-06-30'), y: 6 },
  { x: new Date('2018-06-29'), y: 5 },
  { x: new Date('2018-06-28'), y: 4 },
  { x: new Date('2018-06-27'), y: 3 }
]

describe('LineChart', () => {
  it('should recompute item key to be the max date of the data', () => {
    const state1 = LineChart.getDerivedStateFromProps(
      {
        data: chartData.slice(0, 2)
      },
      null
    )
    const toISODay = ts => {
      const date = new Date(parseInt(ts))
      return date.toISOString().slice(0, 10)
    }

    expect(toISODay(state1.itemKey)).toBe('2018-07-03')
    const state2 = LineChart.getDerivedStateFromProps(
      {
        data: chartData.slice(3, 5)
      },
      state1
    )
    expect(toISODay(state2.itemKey)).toBe('2018-06-30')
    const state3 = LineChart.getDerivedStateFromProps(
      {
        data: chartData.slice(-3)
      },
      state2
    )
    expect(toISODay(state3.itemKey)).toBe('2018-06-29')
  })
})
