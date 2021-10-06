import React from 'react'
import { hashHistory } from 'react-router'

import { withClient } from 'cozy-client'
import { MobileRouter as AuthMobileRouter } from 'cozy-authentication'
import PouchLink from 'cozy-pouch-link'
import { getUniversalLinkDomain } from 'cozy-ui/transpiled/react/AppLinker'

import LogoutModal from 'components/LogoutModal'
import MigrateAdapterDialog from 'components/MigrateAdapterDialog'
import { protocol, appTitle } from 'ducks/mobile/constants'
import manifest from 'ducks/client/manifest'
import initBar from 'ducks/mobile/bar'
import {
  getOldAdapterName,
  getAdapterPlugin,
  shouldMigrateAdapter,
  fetchCredentials
} from 'ducks/client/linksHelpers'
import appIcon from 'targets/favicons/icon-banks.jpg'

export class MobileRouter extends React.Component {
  state = {
    shouldDisplayMigrateDialog: false
  }

  async componentDidMount() {
    const shouldMigrate = await shouldMigrateAdapter()
    this.setState({
      shouldDisplayMigrateDialog: shouldMigrate
    })
  }

  handleMigrateModaleAnswer = async shouldMigrate => {
    this.setState({ shouldDisplayMigrateDialog: false })
    if (shouldMigrate) {
      const { client } = this.props
      const pouchLink = client.links.find(link => {
        return link instanceof PouchLink
      })
      const creds = await fetchCredentials()
      const url = creds.uri
      const oldAdapter = getOldAdapterName()
      const oldAdapterPlugin = getAdapterPlugin(oldAdapter)
      const newAdapterPlugin = getAdapterPlugin('indexeddb')
      const plugins = [oldAdapterPlugin, newAdapterPlugin]
      await pouchLink.migrateAdapter({
        fromAdapter: oldAdapter,
        toAdapter: 'indexeddb',
        url,
        plugins
      })
      // Reload page to benefit from new adapter
      window.location.reload()
    }
  }

  render() {
    const { routes, client } = this.props
    const { shouldDisplayMigrateDialog } = this.state

    return (
      <>
        {shouldDisplayMigrateDialog && (
          <MigrateAdapterDialog
            handleMigrateModaleAnswer={this.handleMigrateModaleAnswer}
          />
        )}
        <AuthMobileRouter
          protocol={protocol}
          history={hashHistory}
          appIcon={appIcon}
          appTitle={appTitle}
          appSlug={manifest.slug}
          universalLinkDomain={getUniversalLinkDomain()}
          onAuthenticated={async () => {
            hashHistory.replace('/balances')
            await initBar(client)
          }}
          LogoutComponent={LogoutModal}
        >
          {routes}
        </AuthMobileRouter>
      </>
    )
  }
}

export default withClient(MobileRouter)
