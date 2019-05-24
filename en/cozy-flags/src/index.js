/* global __ENABLED_FLAGS__ */

import flag from './flag'

if (typeof window !== 'undefined') {
  flag.connect = require('./connect').default
  flag.FlagSwitcher = require('./FlagSwitcher').default
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
