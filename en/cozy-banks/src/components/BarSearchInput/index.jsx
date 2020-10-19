import React, { useState } from 'react'
import cx from 'classnames'
import Icon from 'cozy-ui/transpiled/react/Icon'
import styles from './styles.styl'

const BarSearchInput = ({
  onChange,
  onClick,
  placeholder,
  value,
  autofocus
}) => {
  const [focus, setFocus] = useState(false)
  const handleFocus = () => setFocus(true)
  const handleBlur = () => setFocus(false)
  return (
    <div
      onClick={onClick}
      className={cx(
        styles.InputWrapper,
        focus ? styles['InputWrapper--focus'] : null
      )}
    >
      <Icon icon="magnifier" />
      <input
        onFocus={handleFocus}
        onBlur={handleBlur}
        type="text"
        onChange={onChange}
        placeholder={placeholder}
        value={value}
        autoFocus={autofocus}
      />
    </div>
  )
}

export default BarSearchInput
