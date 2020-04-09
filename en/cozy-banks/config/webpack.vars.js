const {
  getEnabledFlags,
  target,
  addAnalyzer
} = require('cozy-scripts/config/webpack.vars')

const path = require('path')
const production = /:production$/.test(process.env.NODE_ENV)
const hotReload = !!process.env.HOT_RELOAD
const SRC_DIR = path.resolve(__dirname, '../src')

module.exports = {
  production: production,
  target: target,
  hotReload,
  addAnalyzer,
  SRC_DIR,
  enabledFlags: getEnabledFlags()
}
