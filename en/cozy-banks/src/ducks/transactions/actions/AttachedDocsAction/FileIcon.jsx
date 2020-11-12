import React from 'react'
import Icon from 'cozy-ui/transpiled/react/Icon'
import cx from 'classnames'

import FileOutlineIcon from 'cozy-ui/transpiled/react/Icons/FileOutline'

const FileIcon = props => {
  const { className, ...rest } = props

  return (
    <Icon
      icon={FileOutlineIcon}
      className={cx('u-mr-half', className)}
      {...rest}
    />
  )
}

export default FileIcon
