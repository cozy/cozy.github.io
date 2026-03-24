import React from 'react'
import cx from 'classnames'

import { getFlagshipMetadata } from 'cozy-device-helper'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

export const MainView = ({ children, isFullHeight }) => {
  const isImmersive = getFlagshipMetadata().immersive
  const { isMobile } = useBreakpoints()

  return (
    <main
      className={cx(
        'main-view u-flex u-flex-column u-flex-content-start u-flex-content-stretch u-w-100 u-pos-relative',
        isImmersive && 'main-view--immersive',
        isFullHeight && 'main-view--full-height',
        isFullHeight && isMobile && 'main-view--full-height-mobile'
      )}
    >
      {children}
    </main>
  )
}
