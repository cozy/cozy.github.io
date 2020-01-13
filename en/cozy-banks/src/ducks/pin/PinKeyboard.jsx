import React from 'react'
import PropTypes from 'prop-types'
import range from 'lodash/range'

import Icon from 'cozy-ui/transpiled/react/Icon'

import styles from 'ducks/pin/styles.styl'
import PinButton from 'ducks/pin/PinButton'
import { PIN_MAX_LENGTH } from 'ducks/pin/constants'
import backText from 'assets/icons/icon-back-text.svg'
import { shake } from 'utils/effects'

const invisible = {
  opacity: 0
}

const lettersToNumber = {
  2: 'abc',
  3: 'def',
  4: 'ghi',
  5: 'jkl',
  6: 'mno',
  7: 'prqs',
  8: 'tuv',
  9: 'wxyz'
}

/**
 * Shows a value as Dots
 */
const Dots = React.forwardRef(function Dots({ max, value }, ref) {
  return (
    <div ref={ref} className={styles['Pin__dots']}>
      {range(1, max + 1).map(i => (
        <span className={styles['Pin__dot']} key={i}>
          {i <= value.length ? '●' : '_'}
        </span>
      ))}
    </div>
  )
})

Dots.propTypes = {
  value: PropTypes.string.isRequired
}

/**
 * Allows to type a value with an onScreen keyboard.
 * If `onChange` is defined, it acts as a controlled component,
 * otherwise, it keeps an internal state.
 */
class PinKeyboard extends React.PureComponent {
  constructor(props) {
    super(props)
    this.handleConfirm = this.handleConfirm.bind(this)
    this.handleClickNumber = this.handleClickNumber.bind(this)
    this.handleRemoveCharacter = this.handleRemoveCharacter.bind(this)
    this.dotsRef = React.createRef()
  }

  componentDidUpdate(prevProps) {
    const { shake } = this.props
    if (shake !== prevProps.shake && shake) {
      this.shakeDots()
    }
  }

  state = {
    value: ''
  }

  handleConfirm() {
    this.props.onConfirm(this.getValue())
  }

  getValue() {
    return this.props.value || this.state.value
  }

  handleClickNumber(n) {
    const value = this.getValue()
    const newVal = (value + n).substr(0, this.props.pinMaxLength)
    this.handleNewValue(newVal)
  }

  handleRemoveCharacter() {
    const newVal = this.state.value.substr(0, this.state.value.length - 1)
    this.handleNewValue(newVal)
  }

  handleNewValue(newVal) {
    if (this.props.onChange) {
      this.props.onChange(newVal)
    } else {
      this.setState({ value: newVal })
    }
  }

  shakeDots() {
    if (this.dotsRef.current) {
      shake(this.dotsRef.current)
    }
  }

  render() {
    const { topMessage, bottomMessage } = this.props
    const value = this.getValue()
    return (
      <div className={styles.PinKeyboard}>
        <div className={styles.PinKeyboard__top}>
          <div className={styles.PinKeyboard__topMessage}>{topMessage}</div>
          <Dots
            ref={this.dotsRef}
            max={this.props.pinMaxLength}
            value={value}
          />
          <div className={styles.PinKeyboard__bottomMessage}>
            {bottomMessage}
          </div>
        </div>
        <div className={styles.PinKeyboard__bottom}>
          <div className={styles.PinKeyboard__keyboard}>
            {range(1, 10).map(n => (
              <PinButton
                onClick={this.handleClickNumber.bind(null, n.toString())}
                key={n}
              >
                {n}
                <div className={styles['Pin__letters']}>
                  {lettersToNumber[n]}
                </div>
              </PinButton>
            ))}
            {this.props.leftButton || <PinButton style={invisible} />}
            <PinButton onClick={this.handleClickNumber.bind(null, '0')}>
              0
            </PinButton>
            <PinButton isText onClick={this.handleRemoveCharacter}>
              <Icon size="3rem" icon={backText} />
            </PinButton>
          </div>
        </div>
      </div>
    )
  }
}

PinKeyboard.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  topMessage: PropTypes.node,
  bottomMessage: PropTypes.node,
  dotsRef: PropTypes.object
}

PinKeyboard.defaultProps = {
  pinMaxLength: PIN_MAX_LENGTH
}

export default PinKeyboard
