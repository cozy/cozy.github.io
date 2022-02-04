const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')
const path = require('path')
const fs = require('fs')

const VersionPlugin = require('cozy-scripts/plugins/VersionPlugin')

const manifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../manifest.webapp')).toString()
)

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      __APP_VERSION__: JSON.stringify(manifest.version),
      __SENTRY_URL__: JSON.stringify(
        'https://ea2067ca88504d9cbc9115b55d0b2d55:e52e64f57486417bb1b5fa6529e1cfcb@sentry.cozycloud.cc/11'
      ),
      __PIWIK_SITEID__: 8,
      __PIWIK_DIMENSION_ID_APP__: 1,
      __PIWIK_TRACKER_URL__: JSON.stringify(
        'https://matomo.cozycloud.cc/piwik.php'
      )
    }),
    // ChartJS uses moment :( To remove when we do not use it anymore
    new webpack.ContextReplacementPlugin(
      /moment[/\\]locale$/,
      /(en|fr|es)\/index\.js/
    ),
    new webpack.ContextReplacementPlugin(
      /date-fns[/\\]locale$/,
      /(en|fr|es)\/index\.js/
    ),
    new webpack.IgnorePlugin({
      resourceRegExp: /preact-portal/
    }),

    // Checks for duplicates packages
    new DuplicatePackageCheckerPlugin({ verbose: true }),

    // Favicons
    new CopyPlugin([
      { from: 'src/targets/favicons' },
      { from: 'src/targets/screenshots', to: 'screenshots' },
      { from: 'README.md' },
      { from: 'LICENSE' }
    ]),

    new VersionPlugin({
      packages: ['cozy-bar', 'cozy-ui', 'cozy-harvest-lib']
    })
  ]
}
