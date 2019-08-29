import React from 'react'
import UIAppIcon from 'cozy-ui/react/AppIcon'
import { withClient } from 'cozy-client'

// TODO: Move this in cozy-ui
class KonnectorIcon extends React.PureComponent {
  constructor(props) {
    super(props)
    this.fetchIcon = this.fetchIcon.bind(this)
  }

  fetchIcon() {
    const { client, slug, app } = this.props
    return client.stackClient.getIconURL({
      type: 'konnector',
      slug: slug || app.slug
    })
  }

  render() {
    const { className } = this.props

    return <UIAppIcon fetchIcon={this.fetchIcon} className={className} />
  }
}

export default withClient(KonnectorIcon)
