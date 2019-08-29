'use strict'

const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const { production } = require('./webpack.vars')

const output = {
  path: path.resolve(__dirname, '../src/targets/mobile/www')
}

if (process.env.PUBLIC_PATH) {
  output.publicPath = process.env.PUBLIC_PATH
}

module.exports = {
  entry: {
    app: [
      require.resolve('@babel/polyfill'),
      path.resolve(__dirname, '../src/main.jsx')
    ]
  },
  resolve: {
    extensions: ['.mobile.js', '.mobile.jsx'],
    alias: {
      // Chart.js has moment as dependency for backward compatibility but it can
      // survive without it. We do not use date related functionality in chart.js
      // so it is safe to remove moment.
      // https://github.com/chartjs/Chart.js/blob/master/docs/getting-started/integration.md#bundlers-webpack-rollup-etc
      moment: path.resolve(__dirname, '../src/utils/empty')
    }
  },
  output: output,
  plugins: [
    new webpack.DefinePlugin({
      __ALLOW_HTTP__: !production,
      __TARGET__: JSON.stringify('mobile'),
      __POUCH__: JSON.stringify(true)
    }),
    new webpack.ProvidePlugin({
      PouchDB: 'pouchdb',
      pouchdbFind: 'pouchdb-find',
      pouchdbAdapterCordovaSqlite: 'pouchdb-adapter-cordova-sqlite',
      'cozy.client': 'cozy-client-js/dist/cozy-client.js',
      'cozy.bar': `cozy-bar/dist/cozy-bar.mobile.js`
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../src/index.ejs`),
      title: `cozy-banks`,
      chunks: ['app'],
      minify: {
        collapseWhitespace: false
      }
    })
  ]
}
