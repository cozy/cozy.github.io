const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const path = require('path')
const { production } = require('./webpack.vars')

module.exports = {
  entry: [
    require.resolve('@babel/polyfill'),
    path.resolve(__dirname, '../src/main')
  ],

  plugins: [
    // No need for HtmlWebpackHarddiskPlugin in production and it
    // can cause issues when paired with cozy-scripts
    // https://github.com/jantimon/html-webpack-plugin/issues/1068
    production ? null : new HtmlWebpackHarddiskPlugin(),
    new HtmlWebpackPlugin({
      alwaysWriteToDisk: true,
      template: path.resolve(__dirname, `../src/index.ejs`),
      title: `Cozy Banks`,
      minify: {
        collapseWhitespace: false
      }
    })
  ].filter(Boolean)
}
