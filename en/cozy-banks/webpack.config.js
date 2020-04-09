'use strict'

const { ProvidePlugin } = require('webpack')
const merge = require('webpack-merge')
const { mergeAppConfigs } = require('cozy-scripts/utils/merge')
const {
  production,
  target,
  hotReload,
  addAnalyzer
} = require('./config/webpack.vars')

const provided = {}

if (target !== 'mobile') {
  provided['cozy.bar'] = 'cozy-bar/dist/cozy-bar.js'
}

const common = mergeAppConfigs(
  [
    require('cozy-scripts/config/webpack.config.eslint'),
    require('cozy-scripts/config/webpack.config.base'),
    require('cozy-scripts/config/webpack.config.react'),
    require('cozy-scripts/config/webpack.config.cozy-ui'),
    require('cozy-scripts/config/webpack.config.cozy-ui.react'),
    {
      plugins: [new ProvidePlugin(provided)],
      module: {
        rules: [
          {
            test: /cozy-bar\/dist\/cozy-bar\.js$/,
            loader: 'imports-loader?css=./cozy-bar.css'
          }
        ]
      }
    },
    require('cozy-scripts/config/webpack.config.css-modules'),
    require('cozy-scripts/config/webpack.config.pictures'),

    addAnalyzer ? require('cozy-scripts/config/webpack.config.analyzer') : null,
    require('./config/webpack.config.base'),
    require('./config/webpack.config.manual-resolves'),
    require('./config/webpack.config.plugins'),
    require('./config/webpack.config.manifest'),
    hotReload ? require(`./config/webpack.config.hot-reload`) : null
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

module.exports = config

if (require.main === module) {
  // eslint-disable-next-line no-console
  console.log(module.exports)
}
