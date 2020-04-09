const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: [
    require.resolve('@babel/polyfill'),
    path.resolve(__dirname, '../src/main')
  ],

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../src/index.ejs`),
      title: `Cozy Banks`,
      chunks: ['app'],
      minify: {
        collapseWhitespace: false
      }
    })
  ]
}
