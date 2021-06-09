import React from 'react'
import PropTypes from 'prop-types'
import compose from 'lodash/flowRight'

import { translate, useI18n } from 'cozy-ui/transpiled/react/I18n'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Button from 'cozy-ui/transpiled/react/Button'
import { queryConnect, withClient } from 'cozy-client'

import PinKeyboard from 'ducks/pin/PinKeyboard'
import PinWrapper from 'ducks/pin/PinWrapper'
import PinButton from 'ducks/pin/PinButton'
import { pinSetting } from 'ducks/pin/queries'
import { SETTINGS_DOCTYPE } from 'doctypes'
import styles from 'ducks/pin/styles.styl'
import { PIN_MAX_LENGTH } from 'ducks/pin/constants'
import fingerprint from 'assets/icons/icon-fingerprint.svg'

const FullwidthButton = props => <Button {...props} className="u-m-0 u-w-100" />

const FingerprintChoice = ({ onChoice }) => {
  const { t } = useI18n()
  return (
    <div className={styles.Pin__FingerprintChoice}>
      <div className={styles.Pin__FingerprintChoice__top}>
        <Icon className="u-mb-1-half" size="72px" icon={fingerprint} />
        <h2>{t('Pin.use-fingerprint.title')}</h2>
        <p>{t('Pin.use-fingerprint.description')}</p>
      </div>
      <div className="u-flex-grow-0">
        <FullwidthButton
          theme="secondary"
          label={t('Pin.use-fingerprint.yes')}
          onClick={onChoice.bind(null, true)}
        />
        <br />
        <FullwidthButton
          theme="primary"
          label={t('Pin.use-fingerprint.no')}
          onClick={onChoice.bind(null, false)}
        />
      </div>
    </div>
  )
}

/**
 * Handles pin edit
 *  - user has to repeat
 *  - show error if both pin are not the same
 *  - show spinner while pin in saving
 **/
class PinEditView extends React.Component {
  state = {
    pin1: null,
    error: null,
    value: '',
    saving: false
  }

  constructor(props) {
    super(props)
    this.handleKeyboardChange = this.handleKeyboardChange.bind(this)
    this.handleChooseFingerprint = this.handleChooseFingerprint.bind(this)
  }

  componentDidMount() {
    document.addEventListener('back', this.props.onExit)
  }

  componentWillUnmount() {
    document.removeEventListener('back', this.props.onExit)
  }

  async savePin(pinValue, fingerprint) {
    const { client } = this.props
    const doc = this.props.pinSetting.data
    await client.save({
      _type: SETTINGS_DOCTYPE,
      _id: 'pin',
      ...doc,
      pin: pinValue,
      fingerprint
    })
  }

  async checkToSave(pin) {
    if (this.state.pin1) {
      if (this.state.pin1 === pin) {
        this.setState({ chosenPin: pin })
      } else {
        this.setState({ error: 'different-pins', pin1: null, value: '' })
      }
    } else {
      this.setState({ error: null, pin1: pin, value: '' })
    }
  }

  handleKeyboardChange(value) {
    this.setState({ value })
    if (value.length === PIN_MAX_LENGTH) {
      this.checkToSave(value)
    }
  }

  async handleChooseFingerprint(fingerprintChoice) {
    const t = this.props.t
    try {
      await this.savePin(this.state.chosenPin, fingerprintChoice)
    } catch (e) {
      Alerter.error(t('Pin.error-save'))
      throw e
    } finally {
      this.setState({ saving: false })
    }
    Alerter.success(t('Pin.successfully-changed'))
    this.props.onSaved()
  }

  render() {
    const { t } = this.props
    if (this.state.saving) {
      return (
        <PinWrapper>
          <Spinner />
        </PinWrapper>
      )
    }
    const topMessage = (
      <h2>
        {!this.state.pin1
          ? t('Pin.please-choose-pin')
          : t('Pin.please-repeat-pin')}
      </h2>
    )

    const bottomMessage = this.state.error ? (
      <div className={styles['Pin__error']}>
        {t(`Pin.errors.${this.state.error}`)}
      </div>
    ) : null

    return (
      <PinWrapper>
        {!this.state.chosenPin ? (
          <PinKeyboard
            leftButton={
              <PinButton isText onClick={this.props.onExit}>
                {t('General.back')}
              </PinButton>
            }
            topMessage={topMessage}
            bottomMessage={bottomMessage}
            value={this.state.value}
            onChange={this.handleKeyboardChange}
          />
        ) : (
          <FingerprintChoice onChoice={this.handleChooseFingerprint} />
        )}
      </PinWrapper>
    )
  }
}

PinEditView.propTypes = {
  onSaved: PropTypes.func.isRequired
}

export const DumbPinEditView = PinEditView
export default compose(
  translate(),
  withClient,
  queryConnect({
    pinSetting
  })
)(PinEditView)
