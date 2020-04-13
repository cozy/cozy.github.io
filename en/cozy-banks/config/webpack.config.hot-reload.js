const webpack = require('webpack')

const HOST = process.env.DEV_HOST || 'localhost'
const PORT = process.env.DEV_PORT ? parseInt(process.env.DEV_PORT, 10) : 8282

module.exports = {
  output: {
    publicPath: process.env.PUBLIC_PATH || `http://${HOST}:${PORT}/`
  },
  plugins: [new webpack.NamedModulesPlugin()],
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
