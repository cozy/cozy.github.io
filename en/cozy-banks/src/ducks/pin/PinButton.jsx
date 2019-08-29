import React from 'react'
import styles from 'ducks/pin/styles.styl'
import cx from 'classnames'

const PinButton = ({ className, isText, ...props }) => {
  return (
    <button
      {...props}
      className={cx(
        styles['Pin__button'],
        {
          [styles['Pin__button--text']]: isText
        },
        className
      )}
    />
  )
}

export default PinButton
