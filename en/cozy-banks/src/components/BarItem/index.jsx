import styles from 'components/BarItem/styles.styl'
import React from 'react'
import cx from 'classnames'

const BarItem = ({ children, className, style }) => (
  <div className={cx(styles.BarItem, className)} style={style}>
    {children}
  </div>
)

export default BarItem
