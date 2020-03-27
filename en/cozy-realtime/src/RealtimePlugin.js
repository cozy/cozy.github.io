import CozyRealtime from './CozyRealtime'

/**
 * Realtime plugin for cozy-client
 *
 * - Handles login/logout
 * - Proxies subscribe/unsubscribe/unsubscribeAll to CozyRealtime
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
    this.client = client
    this.realtime = null
    this.handleLogin = this.handleLogin.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.client.on('login', this.handleLogin)
    this.client.on('logout', this.handleLogout)

    if (client.isLogged) this.handleLogin()
  }

  handleLogin() {
    this.realtime = new CozyRealtime({
      client: this.client
    })
  }

  handleLogout() {
    this.unsubscribeAll()
    this.realtime = null
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
