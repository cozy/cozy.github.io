'use strict'

const { declare } = require('@babel/helper-plugin-utils')

const browserEnv = {
  targets: {
    chrome: 42,
    ie: 10,
    firefox: 40,
    browsers: ['last 2 versions']
  },
  // don't transform polyfills
  useBuiltIns: false
}

const nodeEnv = {
  targets: {
    node: 8
  },
  // don't transform polyfills
  useBuiltIns: false
}

module.exports = declare((api, options) => {
  // default options
  let presetOptions = {
    node: false,
    react: true,
    transformRegenerator: true
  }

  if (options) {
    for (let option in presetOptions) {
      if (options.hasOwnProperty(option)) {
        if (typeof options[option] !== 'boolean') {
          throw new Error(
            `Preset cozy-app '${option}' option must be a boolean.`
          )
        }
        presetOptions[option] = options[option]
      }
    }
  }

  const { node, react, transformRegenerator } = presetOptions

  const config = {}

  // Latest ECMAScript features on previous browsers versions
  let env = [require.resolve('@babel/preset-env')]
  if (node) {
    env.push(nodeEnv)
  } else {
    env.push(browserEnv)
  }

  let presets = [env]
  // if (P)React app
  if (!node && react) presets.push(require.resolve('@babel/preset-react'))
  config.presets = presets

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
  if (!node && transformRegenerator) {
    plugins.push(
      // Polyfills generator functions (for async/await usage)
      [
        require.resolve('@babel/plugin-transform-runtime'),
        {
          helpers: false,
          regenerator: true
        }
      ]
    )
  }
  config.plugins = plugins
  return config
})
