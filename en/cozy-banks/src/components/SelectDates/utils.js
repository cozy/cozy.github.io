const rangedSome = (arr, predicate, start, end) => {
  start = Math.max(start, 0)
  end = Math.min(end, arr.length)
  const step = start > end ? -1 : 1
  if (!arr || arr.length === 0) {
    return false
  }
  for (let i = start; i !== end; i = i + step) {
    if (predicate(arr[i])) {
      return true
    }
  }
  return false
}

export { rangedSome }
