/* global localStorage */

export const prefix = 'flag__'
export const getKey = name => prefix + name

const listFlagLocalStorage = () => {
  return Object.keys(localStorage)
    .filter(x => x.indexOf(prefix) === 0)
    .map(x => x.replace(prefix, ''))
}

/**
 * Gets a flag from localStorage, parses value from JSON
 *
 * @param  {String} flag
 */
const getItem = flag => {
  const val = localStorage.getItem(getKey(flag))
  const parsed = val ? JSON.parse(val) : val
  return parsed
}

/**
 * Stores a flag in localStorage, stringifies the value for storage
 *
 * @param  {String} flag
 * @param  {String} value
 */
const setItem = (flag, value) => {
  const str = JSON.stringify(value)
  return localStorage.setItem(getKey(flag), str)
}

/**
 * Removes a flag from localStorage
 *
 * @param  {String} flag
 */
const removeItem = flag => {
  return localStorage.removeItem(getKey(flag))
}

/**
 * Returns all stored flags as an object
 */
const getAll = () => {
  const res = {}
  for (const flag of listFlagLocalStorage()) {
    res[flag] = getItem(flag)
  }
  return res
}

/**
 * Clears all the flags from localstorage
 */
const clearAll = () => {
  for (const flag of listFlagLocalStorage()) {
    removeItem(flag)
  }
}

export default {
  getAll,
  getItem,
  setItem,
  clearAll,
  removeItem
}
