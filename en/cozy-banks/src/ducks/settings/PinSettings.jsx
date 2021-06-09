import React from 'react'
import { queryConnect, withClient } from 'cozy-client'
import compose from 'lodash/flowRight'

import { translate } from 'cozy-ui/transpiled/react/I18n'
import ToggleRow from 'ducks/settings/ToggleRow'

import PinEditView from 'ducks/pin/PinEditView'
import PinAuth from 'ducks/pin/PinAuth'
import { pinSetting } from 'ducks/pin/queries'

class PinSettings extends React.Component {
  state = {
    togglingOn: false,
    togglingOff: false
  }

  constructor(props) {
    super(props)
    this.handleExit = this.handleExit.bind(this)
    this.handlePinSaved = this.handlePinSaved.bind(this)
    this.handleToggle = this.handleToggle.bind(this)
    this.handlePinDeactivated = this.handlePinDeactivated.bind(this)
    this.handleTogglingOffCancel = this.handleTogglingOffCancel.bind(this)
  }

  getPinDoc() {
    const { pinSetting } = this.props
    return (pinSetting && pinSetting.data) || null
  }

  handleToggle() {
    const pinDoc = this.getPinDoc()
    if (pinDoc && pinDoc.pin) {
      this.setState({ togglingOff: true })
    } else {
      this.setState({ togglingOn: true })
    }
  }

  handleTogglingOffCancel() {
    this.setState({ togglingOff: false })
  }

  handlePinSaved() {
    this.setState({ togglingOn: false })
  }

  handlePinDeactivated() {
    const pinDoc = this.getPinDoc()
    if (pinDoc && pinDoc.pin) {
      this.props.client.save({ ...pinDoc, pin: null })
      this.setState({ togglingOff: false })
    }
  }

  handleExit() {
    this.setState({ togglingOn: false })
  }

  render() {
    const { pinSetting, t } = this.props
    const pinDoc = pinSetting.data
    if (!pinDoc) {
      return null
    }
    return (
      <React.Fragment>
        <ToggleRow
          title={t('Pin.settings.toggle-title')}
          description={t('Pin.settings.toggle-description')}
          onToggle={this.handleToggle}
          enabled={Boolean(pinDoc.pin)}
          name="pin-doc"
        />
        {this.state.togglingOn ? (
          <PinEditView onSaved={this.handlePinSaved} onExit={this.handleExit} />
        ) : null}
        {this.state.togglingOff ? (
          <PinAuth
            onClickBackButton={this.handleTogglingOffCancel}
            leftButton={null}
            onSuccess={this.handlePinDeactivated}
          />
        ) : null}
      </React.Fragment>
    )
  }
}

export default compose(
  withClient,
  translate(),
  queryConnect({
    pinSetting
  })
)(PinSettings)
