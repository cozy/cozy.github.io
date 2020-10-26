import React from 'react'
import Icon from 'cozy-ui/transpiled/react/Icon'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import cx from 'classnames'
import styles from './SearchIconLink.styl'
import { BarRight } from 'components/Bar'

const SearchIconLink = ({ className }) => {
  return (
    <a className={cx(styles.Icon, className)} href="#/search">
      <Icon icon="magnifier" />
    </a>
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
