import React from 'react'
import { withClient } from 'cozy-client'

class DumbMobileConfigurationModal extends React.Component {
  async componentDidMount() {
    const cozyClient = this.props.client
    const intentWindow = await cozyClient.intents.redirect(
      'io.cozy.apps',
      {
        slug: this.props.slug,
        type: 'konnector'
      },
      open
    )

    intentWindow.addEventListener('exit', this.props.onComplete)
  }

  render() {
    return null
  }
}

const MobileConfigurationModal = withClient(DumbMobileConfigurationModal)

export default MobileConfigurationModal
