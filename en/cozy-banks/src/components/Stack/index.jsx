import React from 'react'
import cx from 'classnames'
import styles from './styles.styl'

const Stack = props => {
  return <div {...props} className={cx(props.className, styles.Stack)} />
}

export default Stack
