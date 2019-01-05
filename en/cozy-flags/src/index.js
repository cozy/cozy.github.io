/* global __ENABLED_FLAGS__ */

import isNode from 'detect-node'
export { default as FlagSwitcher } from './browser/FlagSwitcher'

const flag = isNode
  ? require('./node/flag').default
  : require('./browser/flag').default

/**
 * Enables a list of flags
 * @param {string[]} flagsToEnable
 */
export function enableFlags(flagsToEnable) {
  if (!Array.isArray(flagsToEnable)) {
    return
  }

  flagsToEnable.forEach(flagToEnable => flag(flagToEnable, true))
}

if (typeof __ENABLED_FLAGS__ !== 'undefined') {
  enableFlags(__ENABLED_FLAGS__)
}

flag.enable = enableFlags

export default flag
