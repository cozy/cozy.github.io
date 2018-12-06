/* global localStorage */

export const prefix = 'flag__'
export const getKey = name => prefix + name

export const setFlag = (name, value) => {
  return localStorage.setItem(getKey(name), JSON.stringify(value))
}

export const getFlag = name => {
  const val = localStorage.getItem(getKey(name))
  if (val) {
    return JSON.parse(val)
  } else {
    // set the key so that it can be listed
    setFlag(name, null)
    return null
  }
}

const flag = function() {
  if (!window.localStorage) {
    return
  }
  const args = [].slice.call(arguments)
  if (args.length === 1) {
    return getFlag(args[0])
  } else {
    return setFlag(args[0], args[1])
  }
}

const rxPrefix = new RegExp('^' + prefix)
export const listFlags = () => {
  return Object.keys(localStorage)
    .filter(x => x.indexOf(prefix) > -1)
    .map(x => x.replace(rxPrefix, ''))
}

export const resetFlags = () => {
  listFlags().forEach(name => localStorage.removeItem(getKey(name)))
}

flag.list = listFlags
flag.reset = resetFlags

export default flag
