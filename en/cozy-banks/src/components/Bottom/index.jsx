import React from 'react'
import Portal from 'cozy-ui/transpiled/react/Portal'
import styles from './styles.styl'
import cx from 'classnames'

/** Displays children just above the bar, in Portal */
const Bottom = ({ children, className, ...restProps }) => {
  return (
    <Portal into="body">
      <div className={cx(styles.Bottom, className)} {...restProps}>
        {children}
      </div>
    </Portal>
  )
}

export default Bottom
