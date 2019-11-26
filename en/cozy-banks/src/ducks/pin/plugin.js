import { clear } from './storage'

/**
 * Used to remove local storage on logout
 */
class PinPlugin {
  constructor(client) {
    this.client = client

    client.on('beforeLogout', () => {
      clear()
    })
  }
}

PinPlugin.pluginName = 'pin'

export default PinPlugin
