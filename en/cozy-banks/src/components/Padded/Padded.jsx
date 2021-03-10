import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from 'components/Padded/Padded.styl'

export const Padded = ({ className, ...restProps }) => (
  <div className={cx(styles.Padded, className)} {...restProps} />
)

Padded.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

const Unpadded_ = ({ horizontal, vertical, className, ...restProps }) => {
  const all = horizontal === undefined && vertical === undefined
  return (
    <div
      className={cx(
        {
          [styles['Unpadded--horizontal']]: horizontal || all,
          [styles['Unpadded--vertical']]: vertical || all
        },
        className
      )}
      {...restProps}
    />
  )
}

export const Unpadded = React.memo(Unpadded_)

const MemoPadded = React.memo(Padded)
MemoPadded.Unpadded = Unpadded

export default MemoPadded
