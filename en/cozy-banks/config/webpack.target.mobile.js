'use strict'

const merge = require('webpack-merge')
const path = require('path')
const webpack = require('webpack')
const appConfig = require('./webpack.target.app')

module.exports = merge(appConfig, {
  resolve: {
    extensions: ['.mobile.js', '.mobile.jsx']
  },
  output: {
    path: path.resolve(__dirname, '../src/targets/mobile/www')
  },
  plugins: [
    new webpack.DefinePlugin({
      __TARGET__: JSON.stringify('mobile'),
      __POUCH__: JSON.stringify(true)
    }),
    new webpack.ProvidePlugin({
      PouchDB: 'pouchdb',
      pouchdbFind: 'pouchdb-find',
      pouchdbAdapterCordovaSqlite: 'pouchdb-adapter-cordova-sqlite',
      'cozy.client': 'cozy-client-js/dist/cozy-client.js',
      'cozy.bar': `cozy-bar/dist/cozy-bar.mobile.js`
    })
  ]
})
