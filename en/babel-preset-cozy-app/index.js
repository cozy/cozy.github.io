'use strict'

const { declare } = require('@babel/helper-plugin-utils')
/***
 * We need to target Android 5 and at least iOS 10 for our mobile apps.
 * We have to target Android 4.4 since Android 5 doesn't exist because Webview and OS
 * version are different since Android 5.
 * We didn't find any query targeting Android 5 with a very old browser (ie no updated),
 * we can consider targeting Samsung browser since it should follow Android Browser
 * but I'm not sure this is the right way to do.
 * Changed to 3 last majors version of iOS because I think 2 is pretty dangerous specially when a new iOS version is released.
 */
const browserEnv = {
  targets: [
    'last 2 Chrome major versions',
    'last 2 Firefox major versions',
    'last 2 FirefoxAndroid major versions',
    'last 2 Safari major versions',
    'last 3 iOS major versions',
    'last 2 Edge major versions',
    'Firefox ESR',
    'Android 4.4',
    '> 1% in FR',
    'not dead',
    'not ie <= 11'
  ],
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
