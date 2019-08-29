'use strict'

const webpack = require('webpack')
const { target } = require('./webpack.vars')

const provided = {}

if (target !== 'mobile') {
  provided['cozy.bar'] = 'cozy-bar/dist/cozy-bar.js'
}

module.exports = {
  mode: 'development',
  devtool: process.env.NO_SOURCE_MAP ? false : 'cheap-module-eval-source-map',
  externals: ['cozy'],
  module: {
    rules: [
      {
        test: /cozy-bar\/dist\/cozy-bar\.js$/,
        loader: 'imports-loader?css=./cozy-bar.css'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __STACK_ASSETS__: false,
      __DEV__: true,
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    new webpack.ProvidePlugin(provided)
  ],
  stats: {
    children: false
  }
}
