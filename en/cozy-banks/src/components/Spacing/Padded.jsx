import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from 'components/Spacing/Padded.styl'

const _Padded = ({ className, ...restProps }) => (
  <div className={cx(styles.Padded, className)} {...restProps} />
)

const _Unpadded = ({ horizontal, vertical, className, ...restProps }) => {
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

const Unpadded = React.memo(_Unpadded)

_Padded.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

const Padded = React.memo(_Padded)
Padded.Unpadded = Unpadded

export default Padded
