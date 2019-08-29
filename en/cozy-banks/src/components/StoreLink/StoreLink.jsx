import React from 'react'
import PropTypes from 'prop-types'
import { pickBy } from 'lodash'
import { withClient } from 'cozy-client'

class DumbStoreLink extends React.Component {
  static propTypes = {
    type: PropTypes.oneOf(['konnector', 'webapp']),
    category: PropTypes.string
  }

  async componentDidMount() {
    await this.updateRedirectionURL()
  }

  async componentDidUpdate(prevProps) {
    if (
      this.props.type !== prevProps.type ||
      this.props.category !== prevProps.category
    ) {
      await this.updateRedirectionURL()
    }
  }

  async updateRedirectionURL() {
    const { client, type, category } = this.props

    this.redirectionURL = await client.intents.getRedirectionURL(
      'io.cozy.apps',
      pickBy({ type, category }, Boolean)
    )
  }

  redirect = async () => {
    if (!this.redirectionURL) {
      await this.updateRedirectionURL()
    }

    // We use `window.location` because on desktop we want to stay in the same tab/window
    // and on mobile we want to open the user's browser instead of an inapp browser
    // because in the onboarding flow, the user clicks on email links, which open
    // the "native" browser (external Firefox for example) instead of the in-app one.
    // This means login cookies are stored in the external browser.
    // To prevent asking the user to login again, we have to use an external browser
    // instead of the in app browser.
    window.location = this.redirectionURL
  }

  render() {
    return React.cloneElement(this.props.children, { onClick: this.redirect })
  }
}

const StoreLink = withClient(DumbStoreLink)

export default StoreLink
