import React from 'react'
import IntentModal from 'cozy-ui/transpiled/react/IntentModal'
import { withClient } from 'cozy-client'

class DumbBrowserConfigurationModal extends React.Component {
  render() {
    const { client, slug, ...rest } = this.props

    return (
      <IntentModal
        action="INSTALL"
        doctype="io.cozy.apps"
        mobileFullscreen
        {...rest}
        options={{ slug }}
        create={client.intents.create.bind(client.intents)}
      />
    )
  }
}

const BrowserConfigurationModal = withClient(DumbBrowserConfigurationModal)

export default BrowserConfigurationModal
