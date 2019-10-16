import { resetFilterByDoc } from 'ducks/filters'

/** Used to cleanup redux store when client disconnects */
class CleanupStoreClientPlugin {
  constructor(client, { store }) {
    this.client = client
    this.store = store
    client.on('logout', this.handleLogout.bind(this))
  }

  handleLogout() {
    this.store.dispatch(resetFilterByDoc())
  }
}

CleanupStoreClientPlugin.pluginName = 'store'

export default CleanupStoreClientPlugin
