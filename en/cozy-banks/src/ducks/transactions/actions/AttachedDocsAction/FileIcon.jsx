import React from 'react'
import Icon from 'cozy-ui/transpiled/react/Icon'
import cx from 'classnames'

const FileIcon = props => {
  const { className, ...rest } = props

  return (
    <Icon
      icon="file-outline"
      className={cx('u-mr-half', className)}
      {...rest}
    />
  )
}

export default FileIcon
