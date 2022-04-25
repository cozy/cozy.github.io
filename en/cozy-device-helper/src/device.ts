import capitalize from 'lodash/capitalize'

import { isCordova } from './cordova'
import { hasDevicePlugin } from './plugins'
import { isIOSApp } from './platform'

const DEFAULT_DEVICE = 'Device'

type device = 'iPhone' | 'iPad' | 'Watch' | 'AppleTV' | typeof DEFAULT_DEVICE

// device
const getAppleModel = (identifier: string): device => {
  const devices: device[] = ['iPhone', 'iPad', 'Watch', 'AppleTV']

  for (const device of devices) {
    if (identifier.match(new RegExp(device))) {
      return device
    }
  }

  return DEFAULT_DEVICE
}

export const getDeviceName = (): string => {
  if (!hasDevicePlugin()) {
    if (isCordova()) {
      console.warn('You should install `cordova-plugin-device`.') // eslint-disable-line no-console
    }
    return DEFAULT_DEVICE
  }

  const { manufacturer, model: originalModel } = window.device

  const model = isIOSApp() ? getAppleModel(originalModel) : originalModel

  return `${capitalize(manufacturer)} ${model}`
}
