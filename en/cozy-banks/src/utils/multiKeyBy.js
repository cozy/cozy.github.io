/**
 * Similar to lodash's key by but an item can be
 * indexed by multiple keys
 *
 * @param  {Array<T>} arr   - Array to be indexed
 * @param  {(T) => string} getKeys - Returns multiple keys for an array item
 * @return {Record<string, Array<T>>} - Indexed items
 */
const multiKeyBy = (arr, getKeys) => {
  if (!arr) {
    return {}
  }
  const res = {}
  for (let item of arr) {
    const keys = getKeys(item) || []
    for (let key of keys) {
      res[key] = res[key] || []
      res[key].push(item)
    }
  }
  return res
}

export default multiKeyBy
