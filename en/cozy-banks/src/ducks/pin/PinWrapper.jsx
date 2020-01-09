import React from 'react'
import LockedBody from 'ducks/pin/LockedBody'
import styles from 'ducks/pin/styles.styl'
import BarTheme from 'ducks/bar/BarTheme'
import Portal from 'cozy-ui/transpiled/react/Portal'
import cx from 'classnames'

const PinWrapper = ({ children, className }) => (
  <LockedBody>
    <BarTheme theme="primary" />
    <Portal into="body">
      <div className={cx(styles.PinWrapper, className)}>{children}</div>
    </Portal>
  </LockedBody>
)

export default PinWrapper
