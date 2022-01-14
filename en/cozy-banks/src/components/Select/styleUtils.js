export const mergeStyleFunc = (fn1, fn2) => {
  if (!fn2) {
    return fn1
  }
  return function () {
    return {
      ...fn1.apply(this, arguments),
      ...fn2.apply(this, arguments)
    }
  }
}

export const mergeStyles = (...styleObjs) => {
  let res = {}
  for (let styleObj of styleObjs) {
    if (!styleObj) {
      continue
    }
    for (let [styleProp, styleFn] of Object.entries(styleObj)) {
      if (res[styleProp]) {
        res[styleProp] = mergeStyleFunc(res[styleProp], styleFn)
      } else {
        res[styleProp] = styleFn
      }
    }
  }
  return res
}
