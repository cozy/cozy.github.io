/* global Fingerprint */
import React from 'react'

const isUserCanceled = err => err.includes('Canceled by user')
const isSystemCanceled = err => err.includes('UI canceled by system.')

class WithFingerprint extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {}
    this.setFingerprintWindowShowing =
      this.setFingerprintWindowShowing.bind(this)
    this.handleSuccess = this.handleSuccess.bind(this)
    this.handleError = this.handleError.bind(this)
    this.handleResume = this.handleResume.bind(this)
  }

  componentDidMount() {
    this.checkForFingerprintSystem()
    document.addEventListener('resume', this.handleResume)
  }

  componentWillUnmount() {
    document.removeEventListener('resume', this.handleResume)
  }

  checkForFingerprintSystem() {
    if (typeof Fingerprint === 'undefined') {
      return
    }
    Fingerprint.isAvailable(
      method => {
        this.setState({ method })
        if (this.props.autoLaunch) {
          this.setFingerprintWindowShowing()
        }
      },
      () => {}
    )
  }

  launchFingerprintWindow() {
    Fingerprint.show(
      {
        clientId: 'cozy-banks',
        clientSecret: 'cozy-banks' // Only necessary for Android
      },
      this.handleSuccess,
      this.handleError
    )
  }

  setFingerprintWindowShowing() {
    this.setState(
      {
        showing: true
      },
      () => {
        this.launchFingerprintWindow()
      }
    )
  }

  handleResume() {
    // Since the touch id / faceid window disappears when app loses focus,
    // we have to use the showing state variable to manually re-show
    // the window
    this.checkToShowFingerprintWindow()
  }

  checkToShowFingerprintWindow() {
    if (this.state.showing) {
      this.launchFingerprintWindow()
    }
  }

  handleSuccess() {
    this.setState(
      {
        showing: false
      },
      () => {
        this.props.onSuccess()
      }
    )
  }

  handleError(err) {
    if (isUserCanceled(err)) {
      this.setState(
        {
          showing: false
        },
        () => {
          this.props.onCancel(err)
        }
      )
    } else if (!isSystemCanceled(err)) {
      this.setState(
        {
          showing: false
        },
        () => {
          this.props.onError(err)
        }
      )
    }
  }

  render() {
    return this.props.children(
      this.state.method,
      this.setFingerprintWindowShowing
    )
  }
}

export default WithFingerprint
