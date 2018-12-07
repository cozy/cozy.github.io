let __COZY_FLAGS__ = {}

export const setFlag = (name, value) => {
  __COZY_FLAGS__[name] = value
}

export const getFlag = name => {
  const val = __COZY_FLAGS__[name]

  if (val) {
    return val
  } else {
    // set the key so that it can be listed
    setFlag(name, null)
    return null
  }
}

const flag = function() {
  const args = [].slice.call(arguments)
  if (args.length === 1) {
    return getFlag(args[0])
  } else {
    return setFlag(args[0], args[1])
  }
}

export const listFlags = () => {
  return Object.keys(__COZY_FLAGS__)
}

export const resetFlags = () => {
  __COZY_FLAGS__ = {}
}

flag.list = listFlags
flag.reset = resetFlags

export default flag
