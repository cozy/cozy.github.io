'use strict'

const { declare } = require('@babel/helper-plugin-utils')
const browserslist = require('browserslist-config-cozy')
const {
  validate,
  isFalse,
  isOfType,
  deprecated,
  either
} = require('./validate')
const mapValues = require('lodash/mapValues')
const merge = require('lodash/merge')

const presetEnvBrowserOptions = {
  targets: browserslist,
  // https://github.com/facebook/create-react-app/pull/5278
  exclude: ['transform-typeof-symbol'],
  useBuiltIns: false
}

const presetEnvNodeOptions = {
  targets: {
    node: 8
  },
  // don't transform polyfills
  useBuiltIns: false
}

const optionConfigs = {
  node: {
    default: false,
    validator: isOfType('boolean')
  },
  react: {
    default: true,
    validator: isOfType('boolean')
  },
  transformRegenerator: {
    default: undefined,
    validator: deprecated(
      isOfType('boolean'),
      'Please use transformRuntime options.'
    )
  },
  presetEnv: {
    default: {},
    validator: isOfType('object')
  },
  transformRuntime: {
    default: {
      helpers: true,
      regenerator: true
    },
    validator: either(isOfType('object'), isFalse)
  }
}

const validators = mapValues(optionConfigs, x => x.validator)
const defaultOptions = mapValues(optionConfigs, x => x.default)

const mkConfig = (api, options) => {
  const presetOptions = merge(defaultOptions, options)

  try {
    validate(presetOptions, validators)
  } catch (e) {
    e.message = `babel-preset-cozy-app : Config validation error : ${e.message}`
    throw e
  }

  if (presetOptions.lib) {
    const libConfigs = []

    // Jest does not understand ES6 import by default
    if (process.env.BABEL_ENV !== 'test') {
      libConfigs.push({
        presetEnv: {
          // Libraries are shipped with es6 imports for downstream bundler
          // to be able to prune unused modules away
          modules: false
        }
      })
    }
    merge(presetOptions, ...libConfigs)
  }

  const {
    node,
    react,
    presetEnv,
    transformRuntime,
    transformRegenerator
  } = presetOptions

  const config = {}

  // transformRegenerator is deprecated, should be removed
  if (transformRegenerator !== undefined) {
    transformRuntime.regenerator = transformRegenerator
  }

  // Latest ECMAScript features on previous browsers versions
  const presetEnvOptions = {
    ...(node ? presetEnvNodeOptions : presetEnvBrowserOptions),
    ...presetEnv
  }

  config.presets = [
    [require.resolve('@babel/preset-env'), presetEnvOptions],
    // if (P)React app
    !node && react ? require.resolve('@babel/preset-react') : null
  ].filter(Boolean)

  const plugins = [
    // transform class attributes and methods with auto-binding
    // to the class instance and no constructor needed
    require.resolve('@babel/plugin-proposal-class-properties'),
    // Transform rest properties for object destructuring assignment
    // and spread properties for object literals
    // useBuiltIns to directly use Object.assign instead of using Babel extends
    [
      require.resolve('@babel/plugin-proposal-object-rest-spread'),
      {
        useBuiltIns: false
      }
    ]
  ]
  if (!node && transformRuntime !== false) {
    plugins.push(
      // Polyfills generator functions (for async/await usage)
      [require.resolve('@babel/plugin-transform-runtime'), transformRuntime]
    )
  }
  config.plugins = plugins
  return config
}

module.exports = declare(mkConfig)

if (require.main === module) {
  const options = process.argv[2] ? JSON.parse(process.argv[2]) : {}
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(mkConfig(null, options), null, 2))
}
