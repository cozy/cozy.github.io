import React from 'react'
import styles from 'ducks/pin/styles.styl'
import cx from 'classnames'
import { isIOS } from 'cozy-device-helper'

const shouldDisplayIOSVariant = isIOS()

const PinButton = ({ className, isText, ...props }) => {
  return (
    <button
      {...props}
      className={cx(
        styles['Pin__button'],
        {
          [styles['Pin__button--text']]: isText,
          [styles['Pin__button--ios']]: shouldDisplayIOSVariant
        },
        className
      )}
    />
  )
}

export default PinButton
