import React, { useRef, useCallback } from 'react'
import cx from 'classnames'
import Icon from 'cozy-ui/transpiled/react/Icon'
import styles from './styles.styl'

import MagnifierIcon from 'cozy-ui/transpiled/react/Icons/Magnifier'
import CrossCircleIcon from 'cozy-ui/transpiled/react/Icons/CrossCircle'

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
        <Icon icon={MagnifierIcon} className="u-ml-half" />
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
        <Icon icon={CrossCircleIcon} />
      </BarSearchIcon>
    </div>
  )
}

export default BarSearchInput
