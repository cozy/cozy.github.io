import React, { useRef, useCallback } from 'react'
import cx from 'classnames'
import Icon from 'cozy-ui/transpiled/react/Icon'
import styles from './styles.styl'

const BarSearchIcon = ({ onClick, children, className }) => {
  return (
    <span className={cx(styles.Icon, className)} onClick={onClick}>
      {children}
    </span>
  )
}

const BarSearchInput = ({
  onChange,
  onClick,
  placeholder,
  value,
  autofocus,
  onReset
}) => {
  const inputRef = useRef()

  const handleReset = useCallback(() => {
    onReset && onReset(inputRef.current)
  }, [onReset])
  return (
    <div onClick={onClick} className={styles.InputWrapper}>
      <BarSearchIcon className={styles.SearchIcon}>
        <Icon icon="magnifier" className="u-ml-half" />
      </BarSearchIcon>
      <input
        ref={inputRef}
        type="text"
        onChange={onChange}
        placeholder={placeholder}
        value={value}
        autoFocus={autofocus}
      />
      <BarSearchIcon onClick={handleReset} className={styles.ResetIcon}>
        <Icon icon="cross-circle" />
      </BarSearchIcon>
    </div>
  )
}

export default BarSearchInput
