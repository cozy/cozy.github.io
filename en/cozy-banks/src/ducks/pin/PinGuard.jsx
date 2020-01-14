import React from 'react'

import PinTimeout from 'ducks/pin/PinTimeout.debug'
import PinAuth from 'ducks/pin/PinAuth'
import { pinSetting } from 'ducks/pin/queries'
import { queryConnect } from 'cozy-client'
import { isCollectionLoading } from 'ducks/client/utils'
import { lastInteractionStorage, pinSettingStorage } from './storage'

export const GREEN_BACKGROUND_EFFECT_DURATION = 500

/**
 * Wraps an App and display a Pin screen after a period
 * of inactivity (touch/click/resume events on document).
 */
class PinGuard extends React.Component {
  constructor(props) {
    super(props)
    this.state = this.getInitialState()
    this.handleInteraction = this.handleInteraction.bind(this)
    this.handlePinSuccess = this.handlePinSuccess.bind(this)
    this.handleResume = this.handleResume.bind(this)
  }

  getInitialState() {
    const savedLast = lastInteractionStorage.load()
    const last = savedLast || Date.now()
    const cachedPinSetting = pinSettingStorage.load()

    const willShowPin = this.isTooLate(last)
    return {
      last, // timestamp of last interaction
      showPin: willShowPin,
      cachedPinSetting,
      hasBeenShownOnce: !willShowPin
    }
  }

  componentDidMount() {
    document.addEventListener('touchstart', this.handleInteraction)
    document.addEventListener('click', this.handleInteraction)
    document.addEventListener('resume', this.handleResume)
    document.addEventListener('visibilitychange', this.handleResume)
    this.restartTimeout()
  }

  componentWillUnmount() {
    document.removeEventListener('touchstart', this.handleInteraction)
    document.removeEventListener('click', this.handleInteraction)
    document.removeEventListener('resume', this.handleResume)
    document.removeEventListener('visibilitychange', this.handleResume)
    this.stopTimeout()
  }

  checkToUpdateLocalPinDoc(prevPinSetting) {
    const { pinSetting } = this.props
    if (pinSetting.data !== prevPinSetting.data) {
      this.restartTimeout()
      pinSettingStorage.save(pinSetting.data)
    }
  }

  componentDidUpdate(prevProps) {
    this.checkToUpdateLocalPinDoc(prevProps.pinSetting)
  }

  isTooLate(lastInteractionTimestamp) {
    return Date.now() - this.props.timeout > lastInteractionTimestamp
  }

  checkToShowPin() {
    const now = Date.now()
    if (this.isTooLate(now)) {
      this.showPin()
    }
  }

  handleResume() {
    // setTimeout might not work properly when the application is paused, do this
    // check to be sure that after resume, we display the pin if it
    // is needed
    this.checkToShowPin()
    this.reloadSetting()
  }

  reloadSetting() {
    this.props.pinSetting.fetch()
  }

  showPin() {
    this.setState({ showPin: true })
  }

  hidePin() {
    this.setState({ showPin: false, hasBeenShownOnce: true }, () => {
      this.handleInteraction()
    })
  }

  handleInteraction() {
    if (this.state.showPin) {
      return
    }
    const now = Date.now()
    this.setState({ last: now })
    lastInteractionStorage.save(now)
    this.restartTimeout()
  }

  startTimeout() {
    this.timeout = setTimeout(() => {
      this.showPin()
    }, this.props.timeout)
  }

  stopTimeout() {
    clearTimeout(this.timeout)
  }

  restartTimeout() {
    this.stopTimeout()
    this.startTimeout()
  }

  handlePinSuccess() {
    this.restartTimeout()
    // Delay a bit the success so that the user sees the success
    // effect
    setTimeout(() => {
      this.hidePin()
    }, GREEN_BACKGROUND_EFFECT_DURATION)
  }

  render() {
    const { pinSetting, children, showTimeout, timeout } = this.props
    const { cachedPinSetting, showPin, hasBeenShownOnce, last } = this.state
    const pinDoc = isCollectionLoading(pinSetting)
      ? cachedPinSetting
      : pinSetting.data

    if (!pinDoc || !pinDoc.pin) {
      return children
    }

    return (
      <React.Fragment>
        {hasBeenShownOnce ? children : null}
        {showPin ? <PinAuth onSuccess={this.handlePinSuccess} /> : null}
        {showTimeout ? <PinTimeout start={last} duration={timeout} /> : null}
      </React.Fragment>
    )
  }

  static defaultProps = {
    timeout: 60 * 1000
  }
}

export const DumbPinGuard = PinGuard

export default queryConnect({
  pinSetting
})(PinGuard)
