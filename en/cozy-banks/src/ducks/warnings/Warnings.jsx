/* global __TARGET__ */
import React, { Component } from 'react'
import { withClient } from 'cozy-client'
import { WarningsModal, checkWarnings } from 'ducks/warnings'

class Warnings extends Component {
  state = {
    warnings: null
  }

  componentDidMount() {
    if (__TARGET__ === 'mobile') {
      // document.addEventListener('deviceready', this.checkWarnings)
      // document.addEventListener('resume', this.checkWarnings)
    }
  }

  componentWillUnmount() {
    if (__TARGET__ === 'mobile') {
      // document.removeEventListener('deviceready', this.checkWarnings)
      // document.removeEventListener('resume', this.checkWarnings)
    }
  }

  checkWarnings = () => {
    const cozyClient = this.props.client
    checkWarnings(cozyClient).then(warnings => {
      this.setState({ warnings })
    })
  }

  render() {
    const { warnings } = this.state

    if (warnings) {
      return (
        <div>
          {warnings.map(warning => (
            <WarningsModal
              key={warning.code}
              code={warning.code}
              title={warning.title}
              detail={warning.detail}
              links={warning.links}
            />
          ))}
        </div>
      )
    }

    return null
  }
}

export default withClient(Warnings)
