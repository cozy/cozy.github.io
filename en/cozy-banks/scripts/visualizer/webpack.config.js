const webpack = require('webpack')
const path = require('path')
const { SRC_DIR } = require('../../config/webpack.vars')

module.exports = {
  entry: './src/server/index.js',
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist')
  },
  target: 'node',
  mode: 'none',
  resolve: {
    modules: ['node_modules', SRC_DIR]
  },
  module: {
    exprContextCritical: false
  },
  // To get a correct __dirname
  // See https://codeburst.io/use-webpack-with-dirname-correctly-4cad3b265a92
  node: {
    __dirname: false
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ]
}
