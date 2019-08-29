/* global Fingerprint */
import React from 'react'

class WithFingerprint extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {}
    this.showFingerprintAuth = this.showFingerprintAuth.bind(this)
  }

  componentDidMount() {
    this.checkForFingerprintSystem()
  }

  checkForFingerprintSystem() {
    if (typeof Fingerprint === 'undefined') {
      return
    }
    Fingerprint.isAvailable(
      method => {
        this.setState({ method })
        if (this.props.autoLaunch) {
          this.showFingerprintAuth()
        }
      },
      () => {}
    )
  }

  showFingerprintAuth() {
    Fingerprint.show(
      {
        clientId: 'cozy-banks',
        clientSecret: 'cozy-banks' //Only necessary for Android
      },
      this.props.onSuccess,
      this.handleError
    )
  }

  handleError(err) {
    if (err.indexOf('Canceled by user') > 0) {
      this.props.onCancel(err)
    } else {
      this.props.onError(err)
    }
  }

  render() {
    return this.props.children(this.state.method, this.showFingerprintAuth)
  }
}

export default WithFingerprint
