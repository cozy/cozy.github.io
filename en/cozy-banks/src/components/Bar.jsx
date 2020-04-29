/* global cozy */

import React from 'react'
import { ThemeContext } from './useTheme'

const wrap = Component => {
  const WrappedBarComponent = ({ children }) => {
    return (
      <Component>
        <ThemeContext.Provider value="primary">
          {children}
        </ThemeContext.Provider>
      </Component>
    )
  }
  return WrappedBarComponent
}

export const BarCenter = wrap(cozy.bar.BarCenter)
export const BarRight = wrap(cozy.bar.BarRight)
export const BarLeft = wrap(cozy.bar.BarLeft)
