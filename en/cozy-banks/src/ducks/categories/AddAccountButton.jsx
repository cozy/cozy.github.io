import React, { memo } from 'react'
import Button from 'cozy-ui/transpiled/react/Button'
import AddAccountLink from 'ducks/settings/AddAccountLink'
import styles from 'ducks/categories/AddAccountButton.styl'
import cx from 'classnames'
import { trackEvent } from 'ducks/tracking/browser'

const sleep = time => new Promise(resolve => setTimeout(resolve, time))
const AddAccountButton = ({
  label,
  className,
  absolute,
  onClick,
  ...buttonProps
}) => (
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
      onClick={async ev => {
        trackEvent({
          name: 'ajouter_une_banque'
        })
        await sleep(100) // give some time for event
        onClick(ev)
      }}
      {...buttonProps}
    />
  </AddAccountLink>
)

export default memo(AddAccountButton)
