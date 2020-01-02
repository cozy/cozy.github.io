import CozyRealtime from './CozyRealtime'

/**
 * Realtime plugin for cozy-client
 *
 * @class
 */
class RealtimePlugin {
  /**
   * Constructor of RealtimePlugin
   *
   * @constructor
   * @param {CozyClient} client A cozy-client instance
   */
  constructor(client) {
    this.realtime = new CozyRealtime({ client })
  }

  /**
   * @see CozyRealtime.subscribe
   */
  subscribe(...args) {
    this.realtime.subscribe(...args)
  }

  /**
   * @see CozyRealtime.unsubscribe
   */
  unsubscribe(...args) {
    this.realtime.unsubscribe(...args)
  }

  /**
   * @see CozyRealtime.unsubscribeAll
   */
  unsubscribeAll() {
    this.realtime.unsubscribeAll()
  }
}

RealtimePlugin.pluginName = 'realtime'

export default RealtimePlugin
