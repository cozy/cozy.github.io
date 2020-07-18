import React from 'react'
import { withClient } from 'cozy-client'
import appIcon from 'targets/favicons/icon-banks.jpg'
import { MobileRouter as AuthMobileRouter } from 'cozy-authentication'
import { hashHistory } from 'react-router'
import { protocol, appTitle } from 'ducks/mobile/constants'
import LogoutModal from 'components/LogoutModal'

import manifest from 'ducks/client/manifest'
import initBar from 'ducks/mobile/bar'
import { getUniversalLinkDomain } from 'cozy-ui/transpiled/react/AppLinker'

export class MobileRouter extends React.Component {
  render() {
    const { routes, client } = this.props
    return (
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
    )
  }
}

export default withClient(MobileRouter)
