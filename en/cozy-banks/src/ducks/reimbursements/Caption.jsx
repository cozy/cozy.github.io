import React from 'react'
import cx from 'classnames'

import styles from 'ducks/reimbursements/Reimbursements.styl'

const Caption = props => {
  const { className, ...rest } = props

  return <p className={cx(styles.Caption, className)} {...rest} />
}

export default Caption
