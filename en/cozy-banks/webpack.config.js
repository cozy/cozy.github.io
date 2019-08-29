'use strict'

const merge = require('webpack-merge')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const {
  production,
  target,
  hotReload,
  analyze
} = require('./config/webpack.vars')

const common = merge(
  require('./config/webpack.config.base'),
  require('./config/webpack.config.disable-contexts'),
  require('./config/webpack.config.styles'),
  require('./config/webpack.config.cozy-ui'),
  require('./config/webpack.config.pictures'),
  require('./config/webpack.config.versions'),
  require('./config/webpack.config.manifest'),
  require('./config/webpack.config.piwik'),
  require('./config/webpack.config.vendors'),
  hotReload ? require(`./config/webpack.config.hot-reload`) : null,
  analyze ? require(`./config/webpack.config.analyze`) : null
)

const targetCfg = require(`./config/webpack.target.${target}`)

const withTarget = merge.strategy({
  'resolve.extensions': 'prepend'
})(common, targetCfg)

const modeConfig = production
  ? require('./config/webpack.config.prod')
  : require('./config/webpack.config.dev')

const smp = new SpeedMeasurePlugin()
const config = merge(modeConfig, withTarget)

module.exports = process.env.SMP ? smp.wrap(config) : config

if (require.main === module) {
  // eslint-disable-next-line no-console
  console.log(module.exports)
}
