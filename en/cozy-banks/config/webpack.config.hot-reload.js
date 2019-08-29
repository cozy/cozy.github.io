const webpack = require('webpack')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')

const HOST = process.env.DEV_SERVER_HOST || 'localhost'
const PORT = process.env.DEV_SERVER_PORT
  ? parseInt(process.env.DEV_SERVER_PORT, 10)
  : 8282

module.exports = {
  output: {
    filename: 'app.js',
    publicPath: `http://${HOST}:${PORT}/`
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new HtmlWebpackHarddiskPlugin()
  ],
  devServer: {
    host: HOST,
    port: PORT,
    stats: {
      modules: false,
      chunks: false,
      children: false
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization'
    },
    disableHostCheck: true
  }
}
