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
              use: [require('../stylus')()]
            }
          }
        ]
      },
      {
        test: /\.(png|gif|jpe?g|svg|pdf)$/i,
        loader: 'url-loader'
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin('[name].css'),
    new webpack.DefinePlugin({
      'process.env': {
        USE_REACT: 'true'
      }
    })
  ]
}
