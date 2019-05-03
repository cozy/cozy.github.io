/* global __ENABLED_FLAGS__ */

const isNode = require('detect-node')

const flag = isNode
  ? require('./node/flag').default
  : require('./browser/flag').default

if (!isNode) {
  flag.FlagSwitcher = require('./browser/FlagSwitcher').default
}

/**
 * Enables a list of flags
 * @param {string[]} flagsToEnable
 */
function enableFlags(flagsToEnable) {
  if (!Array.isArray(flagsToEnable)) {
    return
  }

  flagsToEnable.forEach(flagToEnable => flag(flagToEnable, true))
}

if (typeof __ENABLED_FLAGS__ !== 'undefined') {
  enableFlags(__ENABLED_FLAGS__)
}

flag.enable = enableFlags

module.exports = flag
