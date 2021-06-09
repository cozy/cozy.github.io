import React from 'react'
import PropTypes from 'prop-types'
import compose from 'lodash/flowRight'
import debounce from 'lodash/debounce'
import cx from 'classnames'

import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { withClient, queryConnect } from 'cozy-client'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { translate } from 'cozy-ui/transpiled/react//I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import LeftIcon from 'cozy-ui/transpiled/react/Icons/Left'

import styles from 'ducks/pin/styles.styl'
import PinWrapper from 'ducks/pin/PinWrapper'
import PinKeyboard from 'ducks/pin/PinKeyboard'
import WithFingerprint from 'ducks/pin/WithFingerprint'
import { pinSetting } from 'ducks/pin/queries'
import PinButton from 'ducks/pin/PinButton'
import { PIN_MAX_LENGTH, MAX_ATTEMPT } from 'ducks/pin/constants'
import openLock from 'assets/icons/icon-lock-open.svg'
import fingerprint from 'assets/icons/icon-fingerprint.svg'

const AttemptCount_ = ({ current, max }) => {
  const { t } = useI18n()
  return (
    <div className={styles['Pin__error']}>
      {/* Have an unbreakable space so that the error, when it appears, does not make
      the previous content jump */}
      {current > 0 ? t('Pin.attempt-count', { current, max }) : '\u00a0'}
    </div>
  )
}

const AttemptCount = translate()(AttemptCount_)

const DumbFingerprintParagraph = ({ t, onSuccess, onError, onCancel }) => (
  <WithFingerprint
    autoLaunch
    onSuccess={onSuccess}
    onError={onError}
    onCancel={onCancel}
  >
    {(method, promptFinger) => {
      return method ? (
        <Media
          style={{ display: 'inline-flex' }}
          onClick={promptFinger}
          className="u-mv-half"
        >
          <Img className="u-pr-half">
            <Icon size="1.5rem" icon={fingerprint} />
          </Img>
          <Bd>
            <p>{t('Pin.fingerprint-text')}</p>
          </Bd>
        </Media>
      ) : null
    }}
  </WithFingerprint>
)

const PinBackButton = ({ onClick }) => (
  <div className={styles.Pin__BackButton} onClick={onClick}>
    <Icon icon={LeftIcon} />
  </div>
)

export const GREEN_BACKGROUND_EFFECT_DURATION = 500

const AUTH_METHODS = {
  biometric: 'biometric',
  keyboard: 'keyboard'
}

const AUTH_METHODS_OPTIONS = {
  keyboard: {
    successClassName: styles['PinWrapper--success'],
    successDelay: GREEN_BACKGROUND_EFFECT_DURATION
  },
  biometric: {
    successClassName: null,
    successDelay: null
  }
}

const FingerprintParagraph = translate()(DumbFingerprintParagraph)

/**
 * Show pin keyboard and fingerprint button.
 * Automatically checks if it is the right pin while it is entered.
 *
 * - After <props.maxAttempt> bad attempts it logouts the user
 * - It automatically confirms when entered password's length is <props.maxLength>
 */
class PinAuth extends React.Component {
  constructor(props) {
    super(props)
    this.handleBiometricSuccess = this.handleBiometricSuccess.bind(this)
    this.handleBiometricError = this.handleBiometricError.bind(this)
    this.handleBiometricCancel = this.handleBiometricCancel.bind(this)
    this.handleEnteredPin = this.handleEnteredPin.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.handleBadAttempt = this.handleBadAttempt.bind(this)

    this.state = {
      attempt: 0,
      pinValue: '',
      success: false,
      authMethod: null
    }
    this.dots = React.createRef()

    this.clearPinWithAnimation = debounce(this.clearPinWithAnimation, 100, {
      leading: false,
      trailing: true
    })
  }

  handleBiometricSuccess() {
    this.handleAuthSuccess(AUTH_METHODS.biometric)
  }

  handleAuthSuccess(authMethod) {
    if (!AUTH_METHODS_OPTIONS[authMethod]) {
      return
    }
    this.setState({ success: true, authMethod: authMethod })
    if (AUTH_METHODS_OPTIONS[authMethod].successDelay) {
      setTimeout(() => {
        this.props.onSuccess()
      }, AUTH_METHODS_OPTIONS[authMethod].successDelay)
    } else {
      this.props.onSuccess()
    }
  }

  handleBiometricError() {
    const { t } = this.props
    Alerter.info(t('Pin.bad-pin'))
  }

  handleBiometricCancel() {
    // this.props.onCancel()
  }

  handleLogout() {
    this.logout()
  }

  onMaxAttempt() {
    this.logout()
  }

  async logout() {
    const { client } = this.props
    await client.logout()
    window.location.reload()
  }

  handleEnteredPin(pinValue) {
    if (this.cleaning) {
      return
    }
    const { pinSetting, t } = this.props
    const pinDoc = pinSetting.data
    if (!pinDoc) {
      Alerter.info(t('Pin.no-pin-configured'))
      return this.props.onSuccess()
    }

    this.setState({ pinValue })

    if (pinValue === pinDoc.pin) {
      this.handleAuthSuccess(AUTH_METHODS.keyboard)
      return
    } else if (pinValue.length === this.props.maxLength) {
      const newAttempt = this.state.attempt + 1
      if (newAttempt >= this.props.maxAttempt) {
        return this.onMaxAttempt()
      }
      return this.handleBadAttempt()
    }
  }

  async handleBadAttempt() {
    this.clearPinWithAnimation()
    this.setState({ attempt: this.state.attempt + 1 })
  }

  /* Cleans PIN animatedly */
  clearPinWithAnimation() {
    const pinValue = this.state.pinValue
    if (pinValue !== '') {
      this.cleaning = true
      this.setState(
        {
          pinValue: pinValue.substr(0, pinValue.length - 1)
        },
        this.clearPinWithAnimation
      )
    } else {
      this.cleaning = false
    }
  }

  render() {
    const {
      t,
      breakpoints: { largeEnough },
      pinSetting,
      onClickBackButton
    } = this.props
    const { attempt, pinValue, success, authMethod } = this.state
    const pinDoc = pinSetting.data
    const topMessage = (
      <React.Fragment>
        {largeEnough ? (
          <Icon
            icon={success ? openLock : 'lock'}
            size="48px"
            className="u-mb-half"
          />
        ) : null}
        <h2 className="u-mv-half">
          {this.props.message || t('Pin.please-enter-your-pin')}
        </h2>
        {pinDoc && pinDoc.fingerprint ? (
          <FingerprintParagraph
            onSuccess={this.handleBiometricSuccess}
            onError={this.handleBiometricError}
            onCancel={this.handleBiometricCancel}
          />
        ) : null}
      </React.Fragment>
    )

    const successClassName =
      AUTH_METHODS_OPTIONS[authMethod] &&
      AUTH_METHODS_OPTIONS[authMethod].successClassName

    return (
      <PinWrapper className={cx(success && successClassName)}>
        {onClickBackButton ? (
          <PinBackButton onClick={onClickBackButton} />
        ) : null}
        <PinKeyboard
          leftButton={
            this.props.leftButton !== undefined ? (
              this.props.leftButton
            ) : (
              <PinButton isText onClick={this.handleLogout}>
                {t('Pin.logout')}
              </PinButton>
            )
          }
          topMessage={topMessage}
          bottomMessage={
            <AttemptCount max={this.props.maxAttempt} current={attempt} />
          }
          shake={attempt}
          value={pinValue}
          onChange={this.handleEnteredPin}
        />
      </PinWrapper>
    )
  }

  static propTypes = {
    onSuccess: PropTypes.func.isRequired
  }

  static defaultProps = {
    maxAttempt: MAX_ATTEMPT,
    maxLength: PIN_MAX_LENGTH
  }
}

export const RawPinAuth = PinAuth

export const DumbPinAuth = compose(
  withBreakpoints({
    largeEnough: [375] // iPhone 6+
  }),
  withClient,
  connect(),
  translate(),
  withRouter
)(PinAuth)

export default queryConnect({
  pinSetting
})(DumbPinAuth)
