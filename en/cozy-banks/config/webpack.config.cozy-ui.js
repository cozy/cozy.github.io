'use strict'

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')
const path = require('path')

module.exports = {
  resolve: {
    extensions: ['.styl'],
    alias: {
      'cozy-ui/react': 'cozy-ui/transpiled/react'
    }
  },
  module: {
    rules: []
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      options: {
        stylus: {
          use: [require('cozy-ui/stylus')()],
          import: []
        }
      }
    })
  ]
}
