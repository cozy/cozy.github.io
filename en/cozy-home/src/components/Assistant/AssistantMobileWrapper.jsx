import cx from 'classnames'
import React from 'react'

import { getFlagshipMetadata } from 'cozy-device-helper'

import CozyTheme, { useCozyTheme } from 'cozy-ui-plus/dist/providers/CozyTheme'

import { AssistantMobile } from 'cozy-search'

import styles from './assistant.styl'

export const AssistantMobileWrapper = () => {
  const { type } = useCozyTheme()

  return (
    <CozyTheme>
      <div
        className={cx('home-mobile-assistant u-dn', {
          ['home-mobile-assistant--immersive']: getFlagshipMetadata().immersive
        })}
      >
        <AssistantMobile
          componentsProps={{
            SearchBar: {
              className: styles[`search-bar-background--${type}`]
            }
          }}
        />
      </div>
    </CozyTheme>
  )
}

export default AssistantMobileWrapper
