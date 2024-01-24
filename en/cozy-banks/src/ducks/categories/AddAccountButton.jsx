import React, { memo } from 'react'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import AddAccountLink from 'ducks/settings/AddAccountLink'
import styles from 'ducks/categories/AddAccountButton.styl'
import cx from 'classnames'
import { trackEvent } from 'ducks/tracking/browser'

import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Icon from 'cozy-ui/transpiled/react/Icon'

const sleep = time => new Promise(resolve => setTimeout(resolve, time))
export const AddAccountButton = ({
  label,
  buttonTheme,
  className,
  absolute,
  onClick,
  ...buttonProps
}) => (
  <AddAccountLink>
    <Button
      theme={buttonTheme}
      icon={<Icon icon={PlusIcon} />}
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

AddAccountButton.defaultProps = {
  buttonTheme: 'highlight'
}

export default memo(AddAccountButton)
