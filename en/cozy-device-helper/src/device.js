import capitalize from 'lodash/capitalize'

import { isCordova } from './cordova'
import { hasDevicePlugin } from './plugins'
import { isIOSApp } from './platform'

const DEFAULT_DEVICE = 'Device'

// device
const getAppleModel = identifier => {
  const devices = ['iPhone', 'iPad', 'Watch', 'AppleTV']

  for (const device of devices) {
    if (identifier.match(new RegExp(device))) {
      return device
    }
  }

  return DEFAULT_DEVICE
}

export const getDeviceName = () => {
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
