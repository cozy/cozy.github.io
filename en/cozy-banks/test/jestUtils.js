const isDeprecatedLifecycleWarning = (msg, componentName) => {
  return !!(
    (msg &&
      msg.includes &&
      msg.includes('has been renamed, and is not recommended for use') &&
      msg.includes(componentName)) ||
    (msg && msg.includes && msg.includes(componentName))
  )
}

export const ignoreOnConditions = (originalWarn, ignoreConditions) => {
  return function (...args) {
    const msg = args[0]
    if (ignoreConditions.some(condition => condition(msg))) {
      return
    }
    originalWarn.apply(this, args)
  }
}

export const makeDeprecatedLifecycleMatcher = componentName => msg =>
  isDeprecatedLifecycleWarning(msg, componentName)
