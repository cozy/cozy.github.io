'use strict'

const path = require('path')
const webpack = require('webpack')
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')

const { production, SRC_DIR, enabledFlags } = require('./webpack.vars')
const pkg = require(path.resolve(__dirname, '../package.json'))

const mapToNodeModules = packages => {
  const res = {}
  packages.forEach(pkgName => {
    res[pkgName] = path.resolve(__dirname, `../node_modules/${pkgName}`)
  })
  return res
}

module.exports = {
  output: {
    filename: 'app.js'
  },
  resolve: {
    extensions: ['.js', '.json', '.css', '.jsx'],
    modules: ['node_modules', SRC_DIR],
    alias: {
      // Resolving manually package that have multiple versions. They emit warnings with
      // DuplicatePackageChecker plugin. We always use the node_modules version.
      // https://github.com/darrenscerri/duplicate-package-checker-webpack-plugin#resolving-duplicate-packages-in-your-bundle
      ...mapToNodeModules([
        'cozy-device-helper',
        'hoist-non-react-statics',
        'unist-util-is',
        'unist-util-visit',
        'unist-util-visit-parents',
        'lodash',
        'raven-js',
        'warning',
        'prop-types',
        'react',
        'react-redux',
        'react-is',
        'has',
        'date-fns',
        'core-js',
        'regenerator-runtime',
        '@babel/runtime',
        'cozy-client',
        'cozy-stack-client',
        'pouchdb-binary-utils',
        'pouchdb-collections',
        'pouchdb-errors',
        'pouchdb-md5',
        'pouchdb-utils',
        'dom-helpers',
        'inherits',
        'react-markdown',
        'uuid',
        'tough-cookie',
        'string_decoder',
        'safe-buffer',
        'qs',
        'extsprintf',
        'domutils'
      ]),

      // We do not need mime-db (used in cozy-stack-client::FileCollection) so we fake it
      'mime-db': path.resolve(__dirname, '../src/utils/empty-mime-db')
    }
  },
  module: {
    rules: [
      {
        test: /^((?!min).)*\.jsx?$/, // all js, jsx, exclude minified
        include: [SRC_DIR],
        loader: 'eslint-loader',
        enforce: 'pre',
        options: {
          emitWarning: true,
          fix: true,
          rules: {
            'no-debugger': production ? 2 : 0
          }
        }
      },
      {
        test: /\.jsx?$/,
        include: [
          SRC_DIR,
          path.resolve(__dirname, '../docs'),
          path.dirname(require.resolve('cozy-konnector-libs'))
        ],
        loader: 'babel-loader',
        options: {
          cacheDirectory: true
        }
      },
      // Fonts
      {
        test: /\.woff2?$/,
        loader: 'file-loader'
      }
    ],
    noParse: [/localforage\/dist/]
  },

  plugins: [
    new webpack.DefinePlugin({
      __APP_VERSION__: JSON.stringify(pkg.version),
      __SENTRY_URL__: JSON.stringify(
        'https://ea2067ca88504d9cbc9115b55d0b2d55:e52e64f57486417bb1b5fa6529e1cfcb@sentry.cozycloud.cc/11'
      ),
      __ENABLED_FLAGS__: JSON.stringify(enabledFlags)
    }),
    // ChartJS uses moment :( To remove when we do not use it anymore
    new webpack.ContextReplacementPlugin(
      /moment[/\\]locale$/,
      /(en|fr)\/index\.js/
    ),
    new webpack.ContextReplacementPlugin(
      /date-fns[/\\]locale$/,
      /(en|fr)\/index\.js/
    ),
    new DuplicatePackageCheckerPlugin({ verbose: true })
  ]
}
