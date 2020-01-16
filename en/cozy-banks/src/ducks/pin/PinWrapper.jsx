import React from 'react'
import useLockedHTML from 'hooks/useLockedHTML'
import styles from 'ducks/pin/styles.styl'
import BarTheme from 'ducks/bar/BarTheme'
import Portal from 'cozy-ui/transpiled/react/Portal'
import cx from 'classnames'

const PinWrapper = ({ children, className }) => {
  useLockedHTML()

  return (
    <>
      <BarTheme theme="primary" />
      <Portal into="body">
        <div className={cx(styles.PinWrapper, 'u-fx-from-bottom', className)}>
          {children}
        </div>
      </Portal>
    </>
  )
}

export default PinWrapper
