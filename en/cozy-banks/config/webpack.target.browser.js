'use strict'

const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const appConfig = require('./webpack.target.app')

module.exports = merge(appConfig, {
  resolve: {
    extensions: ['.browser.js', '.browser.jsx']
  },
  output: {
    path: path.resolve(__dirname, '../build')
  },
  plugins: [
    new webpack.DefinePlugin({
      __TARGET__: JSON.stringify('browser'),
      __POUCH__: JSON.stringify(process.env.FORCE_POUCH ? true : false)
    })
  ]
})
