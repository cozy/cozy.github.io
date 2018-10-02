const { environment, target } = require('cozy-scripts/config/webpack.vars')

const configs = [
  require('cozy-scripts/config/webpack.config.base'),
  require('cozy-scripts/config/webpack.config.chunks'),
  require('cozy-scripts/config/webpack.config.react'),
  require('cozy-scripts/config/webpack.config.eslint'),
  require('cozy-scripts/config/webpack.config.cozy-ui'),
  require('cozy-scripts/config/webpack.config.cozy-ui.react'),
  require('cozy-scripts/config/webpack.config.intents'),
  require('cozy-scripts/config/webpack.config.pictures'),
  require('cozy-scripts/config/webpack.config.vendors'),
  require('cozy-scripts/config/webpack.config.manifest'),
  require('cozy-scripts/config/webpack.config.progress'),
  require(`cozy-scripts/config/webpack.target.${target}`)
]

if (environment === 'production') {
  configs.push(require('cozy-scripts/config/webpack.environment.prod'))
} else {
  configs.push(require('cozy-scripts/config/webpack.environment.dev'))
}

/*
Or if you just want to overload on the default configuration you can just do

const configs = [
  // this bundle file include all configs file like above
  require('cozy-scripts/config/webpack.bundle.default'),
  require('path/to/my/webpack.config') // your custom config to overload
]
*/

module.exports = configs
