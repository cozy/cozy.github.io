'use strict'

const webpack = require('webpack')
const {target} = require('./webpack.vars')

module.exports = {
  output: {
    filename: 'app.[hash].min.js'
  },
  devtool: false,
  mode: 'production',
  optimization: {
    minimize: true
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'), // to compile on production mode (redux)
      __DEV__: false,
      __DEVTOOLS__: false,
      __STACK_ASSETS__: target === 'mobile' ? false : true
    })
  ]
}
