/* global __ENABLED_FLAGS__ */

import FlagSwitcher from './FlagSwitcher'
import connect from './connect'
import flag from './flag'
import useFlag from './useFlag'

flag.connect = connect
flag.FlagSwitcher = FlagSwitcher
flag.useFlag = useFlag

if (typeof __ENABLED_FLAGS__ !== 'undefined') {
  flag.enable(__ENABLED_FLAGS__)
}

export default flag
