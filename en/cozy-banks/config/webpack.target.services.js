'use strict'

const path = require('path')
const webpack = require('webpack')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const SRC_DIR = path.resolve(__dirname, '../src')

const mimerPath = require.resolve(
  path.join(SRC_DIR, 'ducks/notifications/vendor/mimer.min')
)

// Used to disable node modules we do not use
const noop = require.resolve(path.join(SRC_DIR, 'ducks/notifications/noop'))

module.exports = {
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
      },
      {
        test: /\.webapp$/,
        exclude: /node_modules/,
        loader: 'raw-loader'
      }
    ],

    // Dynamic requires produce warnings in webpack. Some of our dependencies
    // use them for features we do not use, so we can disable them.
    // More information : https://gitlab.cozycloud.cc/labs/cozy-bank/merge_requests/197#note_4018
    exprContextRegExp: /$^/,
    exprContextCritical: false
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          mangle: {
            keep_fnames: true
          }
        }
      })
    ]
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

    /* Does not work in a bundle, we do not use it */
    new webpack.NormalModuleReplacementPlugin(/image-size/, noop),
    new webpack.NormalModuleReplacementPlugin(/uglify-js/, noop),
    new MomentLocalesPlugin({
      localesToKeep: ['fr']
    })
  ]
}
