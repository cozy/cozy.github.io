/* global __TARGET__ */

import { default as mobilePinGuarded } from './hoc'

const desktopPinGuarded = () => x => x

const pinGuarded =
  __TARGET__ === 'mobile' ? mobilePinGuarded : desktopPinGuarded

export { pinGuarded }
