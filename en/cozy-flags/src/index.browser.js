/* global __ENABLED_FLAGS__ */

import flag from './flag'

flag.connect = require('./connect').default
flag.FlagSwitcher = require('./FlagSwitcher').default
flag.useFlag = require('./useFlag').default

if (typeof __ENABLED_FLAGS__ !== 'undefined') {
  flag.enable(__ENABLED_FLAGS__)
}

module.exports = flag
