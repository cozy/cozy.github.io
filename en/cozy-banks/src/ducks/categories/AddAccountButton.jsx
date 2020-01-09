import React, { memo } from 'react'
import Button from 'cozy-ui/transpiled/react/Button'
import AddAccountLink from 'ducks/settings/AddAccountLink'
import styles from 'ducks/categories/AddAccountButton.styl'
import cx from 'classnames'

const AddAccountButton = ({ label, className, absolute, ...buttonProps }) => (
  <AddAccountLink>
    <Button
      theme="highlight"
      icon="plus"
      size="large"
      className={cx(
        styles.AddAccountLink,
        absolute ? styles['AddAccountLink--absolute'] : null,
        className
      )}
      label={label}
      {...buttonProps}
    />
  </AddAccountLink>
)

export default memo(AddAccountButton)
