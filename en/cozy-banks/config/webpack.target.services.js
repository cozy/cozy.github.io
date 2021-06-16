'use strict'

const path = require('path')
const webpack = require('webpack')
const { production } = require('./webpack.vars')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const pickBy = require('lodash/pickBy')

const SRC_DIR = path.resolve(__dirname, '../src')

const mimerPath = require.resolve(
  path.join(SRC_DIR, 'ducks/notifications/vendor/mimer.min')
)

// Used to disable node modules we do not use
const noop = require.resolve(path.join(SRC_DIR, 'ducks/notifications/noop'))

const serviceDir = path.resolve(SRC_DIR, './targets/services/')
const entries = pickBy(
  {
    onOperationOrBillCreate: path.resolve(
      serviceDir,
      './onOperationOrBillCreate'
    ),
    categorization: path.resolve(serviceDir, './categorization.js'),
    stats: path.resolve(serviceDir, './stats.js'),
    autogroups: path.resolve(serviceDir, './autogroups.js'),
    budgetAlerts: path.resolve(serviceDir, './budgetAlerts.js'),
    linkMyselfToAccounts: path.resolve(serviceDir, './linkMyselfToAccounts.js'),
    recurrence: path.resolve(serviceDir, './recurrence.js'),
    konnectorAlerts: path.resolve(serviceDir, './konnectorAlerts.js')
  },
  (entrypointPath, entrypointName) => {
    if (!process.env.WEBPACK_ENTRYPOINT) {
      return true
    } else {
      return entrypointName === process.env.WEBPACK_ENTRYPOINT
    }
  }
)

if (process.env.TEST_TEMPLATES) {
  entries.testTemplates = path.resolve(
    SRC_DIR,
    './ducks/notifications/testTemplates.js'
  )
}

module.exports = {
  entry: entries,
  mode: production ? 'production' : 'development',
  target: 'node',
  devtool: false,
  output: {
    path: path.resolve(__dirname, '../build'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.hbs$/,
        include: SRC_DIR,
        loader: 'raw-loader'
      },
      {
        test: /\.js$/,
        include: /node_modules/,
        loader: 'shebang-loader'
      },
      {
        test: /\.svg$/,
        include: SRC_DIR,
        loader: 'null-loader'
      },
      {
        test: /\.mjs$/,
        type: 'javascript/auto'
      }
    ],

    // Dynamic requires produce warnings in webpack. Some of our dependencies
    // use them for features we do not use, so we can disable them.
    // More information : https://gitlab.cozycloud.cc/labs/cozy-bank/merge_requests/197#note_4018
    exprContextRegExp: /$^/,
    exprContextCritical: false
  },

  resolve: {
    alias: {
      // We are building with target: node as webpack options. This causes webpack
      // to consider the "module" entrypoint from node-fetch. This does not work properly
      // as require('node-fetch') returns a module object (with the default property).
      // Here, we force the resolution to take the commonJS file.
      // TODO See if it is necessary to integrate in cozy-scripts
      'node-fetch': 'node-fetch/lib/index.js',
      // Unminified Handlebars uses `require.extensions` and this causes
      // warnings on Webpack. We should think of a way to precompile
      // our Handlebars template. At the moment it is not possible
      // since we pass helpers at runtime.
      handlebars: 'handlebars/dist/handlebars.min.js'
    }
  },

  plugins: [
    new webpack.NormalModuleReplacementPlugin(/mimer/, mimerPath),

    new webpack.DefinePlugin({
      __TARGET__: JSON.stringify('services')
    }),

    /* Does not work in a bundle, we do not use it */
    new webpack.NormalModuleReplacementPlugin(/image-size/, noop),
    new webpack.NormalModuleReplacementPlugin(/uglify-js/, noop),
    new MomentLocalesPlugin({
      localesToKeep: ['fr']
    })
  ]
}
