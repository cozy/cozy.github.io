import React, { useState } from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import cx from 'classnames'
import UINav, {
  NavItem,
  NavIcon,
  NavText,
  NavLink as UINavLink
} from 'cozy-ui/transpiled/react/Nav'
import { withRouter } from 'react-router'
import { items } from './helpers'

/**
 * Returns true if `to` and `pathname` match
 * Supports `rx` for regex matches.
 */
export const navLinkMatch = (rx, to, pathname) => {
  return rx ? rx.test(pathname) : pathname.slice(1) === to
}

/**
 * Like react-router NavLink but sets the lastClicked state (passed in props)
 * to have a faster change of active (not waiting for the route to completely
 * change).
 */
export const NavLink = withRouter(props => {
  const {
    children,
    to,
    rx,
    location,
    clickState: [lastClicked, setLastClicked]
  } = props

  const pathname = lastClicked ? lastClicked : location.pathname
  const isActive = navLinkMatch(rx, to, pathname)
  return (
    <a
      style={{ outline: 'none' }}
      onClick={() => setLastClicked(to)}
      href={`#${to}`}
      className={cx(
        UINavLink.className,
        isActive ? UINavLink.activeClassName : null
      )}
    >
      {children}
    </a>
  )
})

const NavItems = ({ items }) => {
  const clickState = useState(null)
  return (
    <>
      {items.map((item, i) =>
        item ? (
          <NavItem key={i} secondary={item.secondary}>
            <NavLink to={item.to} rx={item.rx} clickState={clickState}>
              {item.icon ? <NavIcon icon={item.icon} /> : null}
              <NavText>{item.label}</NavText>
            </NavLink>
          </NavItem>
        ) : null
      )}
    </>
  )
}

export const Nav = () => {
  const { t } = useI18n()
  return (
    <UINav>
      <NavItems items={items(t)} />
      {Nav.renderExtra()}
    </UINav>
  )
}

Nav.renderExtra = () => null

export default React.memo(Nav)
