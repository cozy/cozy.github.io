import React, { useRef, useCallback } from 'react'
import cx from 'classnames'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Input from 'cozy-ui/transpiled/react/Input'
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
  defaultValue,
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
        <IconButton className="u-ml-half" size="medium">
          <Icon icon={MagnifierIcon} />
        </IconButton>
      </BarSearchIcon>
      <Input
        fullwidth
        ref={inputRef}
        type="text"
        onChange={onChange}
        placeholder={placeholder}
        value={value}
        defaultValue={
          value === undefined && defaultValue ? defaultValue : undefined
        }
        autoFocus={autofocus}
      />
      <BarSearchIcon onClick={handleReset} className={styles.ResetIcon}>
        <Icon icon={CrossCircleIcon} />
      </BarSearchIcon>
    </div>
  )
}

BarSearchInput.defaultProps = {
  defaultValue: ''
}

export default BarSearchInput
