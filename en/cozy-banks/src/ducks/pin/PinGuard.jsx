import React from 'react'

import PinTimeout from 'ducks/pin/PinTimeout.debug'
import PinAuth from 'ducks/pin/PinAuth'
import { pinSetting } from 'ducks/pin/queries'
import { queryConnect } from 'cozy-client'

/**
 * Wraps an App and display a Pin screen after a period
 * of inactivity (touch events on document).
 */
class PinGuard extends React.Component {
  constructor(props) {
    super(props)
    this.state = { last: Date.now() }
    this.handleInteraction = this.handleInteraction.bind(this)
    this.handlePinSuccess = this.handlePinSuccess.bind(this)
    this.handleResume = this.handleResume.bind(this)
  }

  componentDidMount() {
    document.addEventListener('touchstart', this.handleInteraction)
    document.addEventListener('click', this.handleInteraction)
    document.addEventListener('resume', this.handleResume)
    this.handleInteraction()
  }

  componentWillUnmount() {
    document.removeEventListener('touchstart', this.handleInteraction)
    document.removeEventListener('click', this.handleInteraction)
    document.removeEventListener('resume', this.handleResume)
    clearTimeout(this.timeout)
  }

  componentDidUpdate(prevProps) {
    if (this.props.pinSetting.data !== prevProps.pinSetting.data) {
      this.resetTimeout()
    }
  }

  handleResume() {
    // setTimeout might not work properly when the application is paused, do this
    // check to be sure that after resume, we display the pin if it
    // is needed
    if (Date.now() - this.props.timeout > this.state.last) {
      this.setState({ showPin: true })
    }
  }

  handleInteraction() {
    this.resetTimeout()
  }

  resetTimeout() {
    this.setState({ last: Date.now() })
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      this.setState({ showPin: true })
    }, this.props.timeout)
  }

  handlePinSuccess() {
    setTimeout(() => {
      this.setState({ showPin: false })
    }, 500)
  }

  render() {
    const pinDoc = this.props.pinSetting.data
    if (!pinDoc || !pinDoc.pin) {
      return this.props.children
    }
    return (
      <React.Fragment>
        {this.props.children}
        {this.state.showPin ? (
          <PinAuth onSuccess={this.handlePinSuccess} />
        ) : null}
        {this.props.showTimeout ? (
          <PinTimeout start={this.state.last} duration={this.props.timeout} />
        ) : null}
      </React.Fragment>
    )
  }

  static defaultProps = {
    timeout: 60 * 1000
  }
}

export default queryConnect({
  pinSetting
})(PinGuard)
