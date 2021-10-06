'use strict'

const path = require('path')
const get = require('lodash/get')
const merge = require('webpack-merge')
const { mergeAppConfigs } = require('cozy-scripts/utils/merge')
const {
  production,
  target,
  hotReload,
  addAnalyzer
} = require('./config/webpack.vars')
const mqpacker = require('css-mqpacker')

const barConfig = {
  module: {
    rules: [
      {
        test: /cozy-bar\/dist\/cozy-bar\.js$/,
        loader: 'imports-loader?css=./cozy-bar.css'
      }
    ]
  }
}

const exludeModulesConfig = {
  module: {
    rules: ['node-forge', 'node-jose', 'tldjs'].map(module => ({
      test: path.resolve(__dirname, `node_modules/${module}`),
      loader: 'null-loader'
    }))
  }
}

const appOnlyConfigs = [
  require('cozy-scripts/config/webpack.config.react'),
  require('cozy-scripts/config/webpack.config.cozy-ui'),
  require('cozy-scripts/config/webpack.config.cozy-ui.react'),
  require('cozy-scripts/config/webpack.config.css-modules'),
  require('cozy-scripts/config/webpack.config.pictures'),
  barConfig,
  exludeModulesConfig
]

const common = mergeAppConfigs(
  [
    require('cozy-scripts/config/webpack.config.eslint'),
    require('cozy-scripts/config/webpack.config.base'),
    ...(target !== 'services' ? appOnlyConfigs : []),
    addAnalyzer ? require('cozy-scripts/config/webpack.config.analyzer') : null,
    require('./config/webpack.config.base'),
    require('./config/webpack.config.manual-resolves'),
    require('./config/webpack.config.plugins'),
    require('cozy-scripts/config/webpack.config.manifest'),
    hotReload ? require(`./config/webpack.config.hot-reload`) : null,
    { devtool: false }
  ].filter(Boolean)
)

const targetCfg = require(`./config/webpack.target.${target}`)

const withTarget = merge.strategy({
  'resolve.extensions': 'prepend'
})(common, targetCfg)

const modeConfig = production
  ? require('cozy-scripts/config/webpack.environment.prod')
  : require('cozy-scripts/config/webpack.environment.dev')

const config = merge(modeConfig, withTarget)

const removeCSSMQPackerPlugin = config => {
  config.plugins.forEach(plugin => {
    if (plugin.constructor.name === 'PostCSSAssetsPlugin') {
      const prevLength = plugin.plugins.length
      plugin.plugins = plugin.plugins.filter(
        postcssPlugin => postcssPlugin !== mqpacker
      )
      if (prevLength > plugin.plugins.length) {
        // eslint-disable-next-line no-console
        console.log('Removed mqpacker plugin from PostCSSAssetsPlugin')
      }
    }
  })
}

const configureTerserPlugin = config => {
  if (!get(config, 'optimization.minimizer[0]')) {
    return
  }

  // mjml uses class names to register its components. classes are transpiled
  // by babel into functions. If keep_fnames is set to false (its default value),
  // we have errors when using mjml2html:
  // "Element mj-column doesn't exist or is not registered"
  // See https://github.com/cozy/create-cozy-app/issues/1339
  // eslint-disable-next-line no-console
  console.log('Configured terser not to mangle function names')
  const terserOptions = config.optimization.minimizer[0].options.terserOptions
  terserOptions.mangle = {
    keep_fnames: true
  }
}

// TODO remove those lines after https://github.com/cozy/create-cozy-app/pull/1326
// is fixed
removeCSSMQPackerPlugin(config)

if (target === 'services') {
  configureTerserPlugin(config)
}

module.exports = config

if (require.main === module) {
  // eslint-disable-next-line no-console
  console.log(module.exports)
}
