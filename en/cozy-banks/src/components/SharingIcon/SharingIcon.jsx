import React from 'react'
import Types from 'prop-types'
import classnames from 'classnames'
import styles from 'components/SharingIcon/SharingIcon.styl'

const SharingIcon = ({ to, from }) => (
  <i
    className={classnames(styles['sharing-icon'], {
      [styles['sharing-icon--to']]: to,
      [styles['sharing-icon--from']]: from
    })}
  />
)

SharingIcon.propTypes = {
  /** Name of the person to whom you are sharing */
  to: Types.string,
  /** Name of the person from whom you are sharing */
  from: Types.string
}

export default SharingIcon
