'use strict'

const {production} = require('./webpack.vars')

module.exports = {
  module: {
    rules: [
      {
        test: /\.svg$/,
        include: /(sprites|assets\/icons)/,
        loader: 'svg-sprite-loader?name=[name]_[hash]'
      },
      {
        test: /\.(png|gif|jpe?g|svg)$/i,
        exclude: /(sprites|assets\/icons)/,
        loader: `file-loader?path=img&name=[name]${production ? '.[hash]' : ''}.[ext]`
      }
    ]
  }
}
