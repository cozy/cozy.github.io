/**
 * If obj[name] is a function, invokes it with this binded to obj and with args
 * Otherwise, returns obj[name]
 *
 * Similar to lodash's result but supports arguments
 */
const resultWithArgs = (obj, name, args) => {
  const v = obj[name]
  if (typeof v === 'function') {
    return v.apply(obj, args)
  } else {
    return v
  }
}

export default resultWithArgs
