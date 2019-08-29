'use strict'

const {skin} = require('./webpack.vars')
const CopyPlugin = require('copy-webpack-plugin')

const copies = []

if (skin === 'mesinfos') {
  copies.push({ from: 'src/targets/favicons/mesinfos' })
}

copies.push({ from: 'src/targets/favicons' })

module.exports = {
  plugins: [
    new CopyPlugin(copies)
  ]
}
