const webpack = require('webpack')

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      __PIWIK_SITEID__: 8,
      __PIWIK_TRACKER_URL__: JSON.stringify(
        'https://matomo.cozycloud.cc/piwik.php'
      )
    })
  ]
}
