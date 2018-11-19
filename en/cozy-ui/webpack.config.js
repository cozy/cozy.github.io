const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')

module.exports = {
  resolve: {
    extensions: ['.jsx', '.js', '.json', '.styl']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.styl$/,
        loader: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[local]--[hash:base64:5]'
            }
          },
          {
            loader: 'stylus-loader',
            options: {
              use: [ require('../stylus')() ]
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin('[name].css')
  ]
}
