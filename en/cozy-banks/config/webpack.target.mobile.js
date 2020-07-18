'use strict'

const merge = require('webpack-merge')
const path = require('path')
const webpack = require('webpack')
const appConfig = require('./webpack.target.app')

module.exports = merge(appConfig, {
  resolve: {
    extensions: ['.mobile.js', '.mobile.jsx'],
    alias: {
      'cozy-bar/dist/cozy-bar': 'cozy-bar/dist/cozy-bar.mobile'
    }
  },
  output: {
    path: path.resolve(__dirname, '../src/targets/mobile/www')
  },
  plugins: [
    new webpack.DefinePlugin({
      __TARGET__: JSON.stringify('mobile'),
      __POUCH__: JSON.stringify(true)
    })
  ]
})
