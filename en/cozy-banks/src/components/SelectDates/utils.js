import startOfMonth from 'date-fns/start_of_month'
import addMonths from 'date-fns/add_months'
import isSameDay from 'date-fns/is_same_day'

const rangedSome = (arr, predicate, start, end) => {
  const realStart = Math.max(start, 0)
  const realEnd = Math.min(end, arr.length)
  const step = realStart > realEnd ? -1 : 1
  if (!arr || arr.length === 0) {
    return false
  }
  for (let i = realStart; i !== realEnd; i = i + step) {
    if (predicate(arr[i])) {
      return true
    }
  }
  return false
}

export const monthRange = (earliestDate, latestDate, step = 1) => {
  const res = []
  let cur = earliestDate
  if (isSameDay(earliestDate, latestDate)) {
    return [earliestDate]
  }
  while (cur < latestDate) {
    res.push(cur)
    const sm = startOfMonth(cur)
    cur = addMonths(sm, step)
  }
  return res
}

export { rangedSome }
