/* global cozy */

import React from 'react'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'

const wrap = Component => {
  const WrappedBarComponent = ({ children }) => {
    return (
      <Component>
        <CozyTheme className="u-flex u-flex-center" variant="inverted">
          {children}
        </CozyTheme>
      </Component>
    )
  }
  return WrappedBarComponent
}

export const BarCenter = wrap(cozy.bar.BarCenter)
export const BarRight = wrap(cozy.bar.BarRight)
export const BarLeft = wrap(cozy.bar.BarLeft)
