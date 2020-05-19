/* global cozy */

import React from 'react'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'
import cx from 'classnames'

const wrap = (Component, className) => {
  const WrappedBarComponent = ({ children }) => {
    return (
      <Component>
        <CozyTheme className={cx('u-flex', className)} variant="inverted">
          {children}
        </CozyTheme>
      </Component>
    )
  }
  return WrappedBarComponent
}

export const BarCenter = wrap(cozy.bar.BarCenter, 'u-ellipsis')
export const BarRight = wrap(cozy.bar.BarRight)
export const BarLeft = wrap(cozy.bar.BarLeft)
