import React from 'react'
import cx from 'classnames'
import styles from './styles.styl'

const Skeleton = ({ width }) => {
  return (
    <div className={cx(styles.skeleton, styles[`skeleton--${width}`])}></div>
  )
}

Skeleton.defaultProps = {
  width: 'medium'
}

export default Skeleton
