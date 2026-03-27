import cx from 'classnames'
import React from 'react'

import { useClient } from 'cozy-client'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'

import styles from './Personalization.styl'
import { ThemeSwitcher } from './ThemeSwitcher'
import Wallpaper from './Wallpaper'

export const PersonalizationModal = ({
  isAnimationComplete = false,
  showCloseButton = false,
  onClose = undefined
}) => {
  const client = useClient()
  const headerSwitcherClassname = showCloseButton
    ? styles['personalize-header-switcher']
    : undefined
  const headerClassname = cx(
    styles['personalize-modal-title'],
    'u-flex u-flex-row u-flex-items-center u-flex-justify-end u-m-1'
  )

  return (
    <div className="u-w-100 u-h-100 u-flex u-flex-column u-flex-items-center u-flex-items-end-t u-flex-items-end-t u-flex-items-end-s u-flex-justify-start u-pos-relative">
      <div className="u-w-100 u-flex u-flex-justify-end">
        <div className={headerClassname}>
          <div className={headerSwitcherClassname}>
            <ThemeSwitcher isAnimationComplete={isAnimationComplete} />
          </div>
          {showCloseButton && (
            <IconButton
              className="u-ml-half"
              onClick={onClose}
              aria-label="Close wallpaper personalization dialog"
              size="small"
            >
              <Icon icon={CrossIcon} size={16} />
            </IconButton>
          )}
        </div>
      </div>

      <Wallpaper client={client} />
    </div>
  )
}
