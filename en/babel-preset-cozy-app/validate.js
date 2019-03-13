const isOfType = type => (value, key) => {
  if (!(typeof value === type)) {
    throw new Error(`"${key}" must be a ${type}`)
  }
}

const isFalse = (value, key) => {
  if (value !== false) {
    throw new Error(`"${key}" must be false`)
  }
}

const either = (...validators) => (value, key) => {
  let errors = []
  for (const validator of validators) {
    try {
      validator(value, key)
      return
    } catch (e) {
      errors.push(e)
    }
  }
  throw new Error(
    `"${value}" at ${key} did not pass either validator : ${errors
      .map(e => e.message)
      .join('\n')}`
  )
}

const validate = (obj, validators) => {
  for (const key of Object.keys(obj)) {
    const validator = validators[key]
    if (validator) {
      try {
        validator(obj[key], key)
      } catch (e) {
        e.message = 'Validation error: ' + e.message
        throw e
      }
    }
  }
}

const deprecated = (fn, msg) => (value, key) => {
  if (value !== undefined) {
    // eslint-disable-next-line no-console
    console.warn(key, 'is deprecated.', msg)
  }
}

module.exports = {
  validate,
  isOfType,
  deprecated,
  either,
  isFalse
}
