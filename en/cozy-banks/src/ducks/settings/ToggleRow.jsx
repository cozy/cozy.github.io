import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Toggle from 'cozy-ui/react/Toggle'
import cx from 'classnames'
import styles from 'ducks/settings/ToggleRow.styl'

const parseNumber = val => {
  val = val.replace(/\D/gi, '') || 0
  return parseInt(val, 10)
}

export const ToggleRowWrapper = props => {
  const { className, ...rest } = props

  return <div className={cx(styles.ToggleRow__wrapper, className)} {...rest} />
}

export const ToggleRowTitle = props => {
  return <h5 {...props} />
}

export const ToggleRowContent = props => {
  const { className, ...rest } = props

  return <div className={cx(styles.ToggleRow__body, className)} {...rest} />
}

export const ToggleRowDescription = props => {
  const { className, ...rest } = props

  return (
    <div className={cx(styles.ToggleRow__description, className)} {...rest} />
  )
}

export const ToggleRowInput = props => {
  const { onChange, value, unit, className, ...rest } = props

  return (
    <span className={cx(styles.ToggleRow__input, className)} {...rest}>
      <span className={styles.ToggleRow__inputContainer}>
        <input type="text" onChange={onChange} value={value} />
      </span>
      {unit && <span>{unit}</span>}
    </span>
  )
}

export const ToggleRowToggle = props => {
  const { id, checked, onToggle, className, ...rest } = props

  return (
    <div className={cx(styles.ToggleRow__toggle, className)} {...rest}>
      <Toggle id={id} checked={checked} onToggle={onToggle} />
    </div>
  )
}

class ToggleRow extends Component {
  render() {
    const {
      enabled,
      value,
      title,
      description,
      onChangeValue,
      name,
      onToggle,
      unit
    } = this.props

    const hasValue = value !== undefined

    return (
      <ToggleRowWrapper>
        {title && <ToggleRowTitle>{title}</ToggleRowTitle>}
        <ToggleRowContent>
          <ToggleRowDescription>
            <span dangerouslySetInnerHTML={{ __html: description }} />
            {hasValue && (
              <ToggleRowInput
                value={value}
                onChange={e => onChangeValue(parseNumber(e.target.value))}
                unit={unit}
              />
            )}
          </ToggleRowDescription>

          <ToggleRowToggle
            id={name}
            checked={enabled}
            onToggle={checked => onToggle(checked)}
          />
        </ToggleRowContent>
      </ToggleRowWrapper>
    )
  }
}

ToggleRow.propTypes = {
  enabled: PropTypes.bool.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string,
  description: PropTypes.string.isRequired,
  onChangeValue: PropTypes.func,
  name: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
  unit: PropTypes.string
}

export default ToggleRow
