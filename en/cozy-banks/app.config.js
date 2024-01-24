const path = require('path')
const webpack = require('webpack')
const fs = require('fs')
const { DefinePlugin } = require('webpack')
const manifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './manifest.webapp')).toString()
)

const SRC_DIR = path.resolve(__dirname, './src')

const configurationFiles = []

configurationFiles.push(
  require('cozy-scripts/config/webpack.bundle.default.js')
)

configurationFiles.push({
  multiple: {
    services: require('./config/webpack.target.services.js')
  }
})

configurationFiles.push(
  require('cozy-scripts/config/webpack.config.css-modules')
)

const extraConfig = {
  resolve: {
    modules: ['node_modules', SRC_DIR],
    alias: {
      src: SRC_DIR
    }
  },
  plugins: [
    // ChartJS uses moment :( To remove when we do not use it anymore
    new webpack.ContextReplacementPlugin(
      /moment[/\\]locale$/,
      /(en|fr|es)\/index\.js/
    ),
    new webpack.ContextReplacementPlugin(
      /date-fns[/\\]locale$/,
      /(en|fr|es)\/index\.js/
    ),
    new DefinePlugin({
      __APP_VERSION__: JSON.stringify(manifest.version),
      __SENTRY_URL__: JSON.stringify(
        'https://d18802c5412f4b8babe4aad094618d37@errors.cozycloud.cc/38'
      ),
      __PIWIK_SITEID__: 8,
      __PIWIK_DIMENSION_ID_APP__: 1,
      __PIWIK_TRACKER_URL__: JSON.stringify(
        'https://matomo.cozycloud.cc/piwik.php'
      ),
      __POUCH__: JSON.stringify(process.env.FORCE_POUCH ? true : false)
    })
  ]
}
configurationFiles.push(extraConfig)

const exludeModulesConfig = {
  module: {
    rules: ['tldjs'].map(module => ({
      test: path.resolve(__dirname, `node_modules/${module}`),
      loader: 'null-loader'
    }))
  }
}

configurationFiles.push(exludeModulesConfig)

module.exports = configurationFiles
