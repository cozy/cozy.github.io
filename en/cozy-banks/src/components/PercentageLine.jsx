import React from 'react'
import cx from 'classnames'
import styles from './PercentageLine.styl'

const PercentageLine = ({ value, color, className, style }) => (
  <div
    className={cx(className, styles.PercentageLine)}
    style={{
      transform: `scaleX(${value / 100})`,
      backgroundColor: color,
      ...style
    }}
  />
)

export default PercentageLine
