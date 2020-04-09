'use strict'

const CopyPlugin = require('copy-webpack-plugin')
const path = require('path')
const merge = require('lodash/merge')
const pkg = require('../package.json')

const additionalProperties = {
  version: pkg.version
}

module.exports = {
  module: {
    rules: [
      {
        test: /manifest\.webapp$/,
        loader: path.resolve(__dirname, '../loaders/manifest-loader.js'),
        options: { additionalProperties }
      }
    ]
  },
  plugins: [
    new CopyPlugin([{ from: 'manifest.webapp', transform: transformManifest }])
  ]
}

// Method to modify the manifest slug at build time
function transformManifest(buffer) {
  const manifest = JSON.parse(buffer.toString())

  return JSON.stringify(merge(manifest, additionalProperties), null, 2)
}
