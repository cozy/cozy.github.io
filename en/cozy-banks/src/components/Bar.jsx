import React from 'react'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'
import cx from 'classnames'
import cozyBar from 'utils/cozyBar'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const wrap = (Component, className) => {
  const WrappedBarComponent = ({ children }) => {
    const { isMobile } = useBreakpoints()
    return (
      <Component>
        <CozyTheme
          className={cx('u-flex u-flex-items-center', className)}
          variant={isMobile ? 'inverted' : 'normal'}
          ignoreItself={false}
        >
          {children}
        </CozyTheme>
      </Component>
    )
  }
  return WrappedBarComponent
}

export const BarCenter = wrap(cozyBar.BarCenter, 'u-ellipsis')
export const BarRight = wrap(cozyBar.BarRight)
export const BarLeft = wrap(cozyBar.BarLeft)
export const BarSearch = wrap(cozyBar.BarSearch, 'u-flex-grow')
