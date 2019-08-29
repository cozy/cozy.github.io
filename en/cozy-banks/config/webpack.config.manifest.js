'use strict'

const CopyPlugin = require('copy-webpack-plugin')
const path = require('path')
const merge = require('lodash/merge')
const pkg = require('../package.json')

const { skin } = require('./webpack.vars')

const skinToProperties = {
  mesinfos: {
    slug: 'mesinfos-banques',
    name: 'Banques',
    category: 'partners'
  },
  demo: {
    permissions: {
      sharings: {
        description: 'Handle shared bank accounts',
        type: 'io.cozy.mocks.sharings',
        verbs: ['GET']
      },
      recipients: {
        description: 'Get recipients for shared accounts',
        type: 'io.cozy.mocks.recipients',
        verbs: ['GET']
      }
    }
  }
}

const additionalProperties = skinToProperties[skin] || {}
additionalProperties.version = pkg.version

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
    new CopyPlugin([
      { from: 'manifest.webapp', transform: transformManifest },
      { from: 'src/targets/screenshots', to: 'screenshots' },
      { from: 'README.md' },
      { from: 'LICENSE' }
    ])
  ]
}

// Method to modify the manifest slug at build time
function transformManifest(buffer) {
  const manifest = JSON.parse(buffer.toString())

  return JSON.stringify(merge(manifest, additionalProperties), null, 2)
}
