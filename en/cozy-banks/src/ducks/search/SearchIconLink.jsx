import React from 'react'
import IconButton from 'cozy-ui/transpiled/react/IconButton'

import Icon from 'cozy-ui/transpiled/react/Icon'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import MagnifierIcon from 'cozy-ui/transpiled/react/Icons/Magnifier'

import cx from 'classnames'
import { BarRight } from 'components/Bar'

const SearchIconLink = ({ className }) => {
  return (
    <IconButton
      component="a"
      href="#/search"
      className={cx('u-mr-half', className)}
      size="medium"
    >
      <Icon icon={MagnifierIcon} />
    </IconButton>
  )
}

export const MobileBarSearchIconLink = () => {
  const { isMobile } = useBreakpoints()
  return isMobile ? (
    <BarRight>
      <SearchIconLink />
    </BarRight>
  ) : null
}

export default SearchIconLink
