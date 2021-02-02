import overEvery from 'lodash/overEvery'

const validators = {
  has: attr => {
    const fn = x => x && typeof x[attr] !== 'undefined'
    const name = `has[${attr}]`
    return {
      name,
      fn
    }
  },
  is: type => {
    const fn = x => typeof x === type
    const name = `is[${type}]`
    return { fn, name }
  },
  and: (...args) => {
    const fn = overEvery(args.map(arg => arg.fn))
    const name = `and[${args.map(arg => arg.name).join(', ')}]`
    return { fn, name }
  }
}

export const isString = validators.is('string')
export const isObject = validators.is('object')
export const isFunction = validators.is('function')
export const isArray = validators.and(
  validators.is('object'),
  validators.has('length')
)

export const validateAgainst = (obj, types) => {
  for (let [name, validator] of Object.entries(types)) {
    if (!validator.fn(obj[name])) {
      throw new Error(
        `ValidationError: ${name} attribute (value: ${JSON.stringify(
          obj[name]
        )}) does not validate against ${validator.name}.`
      )
    }
  }
}
