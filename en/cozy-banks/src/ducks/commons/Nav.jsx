import React, { useState } from 'react'
import { useI18n } from 'cozy-ui/transpiled/react'
import cx from 'classnames'
import UINav, {
  NavItem,
  NavIcon,
  NavText,
  NavLink as UINavLink
} from 'cozy-ui/transpiled/react/Nav'
import { withRouter } from 'react-router'
import flag from 'cozy-flags'

import wallet from 'assets/icons/icon-wallet.svg'
import graph from 'assets/icons/icon-graph.svg'
import transfers from 'assets/icons/icon-transfers.svg'

/**
 * Matches between the `to` prop and the router current location.
 * Supports `rx` for regex matches.
 */
const navLinkMatch = props =>
  props.rx
    ? props.rx.test(props.location.pathname)
    : props.location.pathname.slice(1) === props.to

/**
 * Like react-router NavLink but sets the lastClicked state (passed in props)
 * to have a faster change of active (not waiting for the route to completely
 * change).
 */
export const NavLink = withRouter(props => {
  const {
    children,
    to,
    clickState: [lastClicked, setLastClicked]
  } = props
  return (
    <a
      style={{ outline: 'none' }}
      onClick={() => setLastClicked(to)}
      href={`#/${to}`}
      className={cx(
        UINavLink.className,
        (!lastClicked && navLinkMatch(props)) || lastClicked === to
          ? UINavLink.activeClassName
          : null
      )}
    >
      {children}
    </a>
  )
})

const transferRoute = /\/transfers(\/.*)?/
const settingsRoute = /\/settings(\/.*)?/
const balancesRoute = /\/balances(\/.*)?/
const categoriesRoute = /\/categories(\/.*)?/

const NavItems = ({ items }) => {
  const clickState = useState(null)
  return (
    <>
      {items.map((item, i) =>
        item ? (
          <NavItem key={i}>
            <NavLink to={item.to} rx={item.rx} clickState={clickState}>
              <NavIcon icon={item.icon} />
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
      <NavItems
        items={[
          {
            to: 'balances',
            icon: wallet,
            label: t('Nav.my-accounts'),
            rx: balancesRoute
          },
          {
            to: 'categories',
            icon: graph,
            label: t('Nav.categorisation'),
            rx: categoriesRoute
          },
          flag('transfers')
            ? {
                to: 'transfers',
                icon: transfers,
                label: t('Transfer.nav'),
                rx: transferRoute
              }
            : null,
          {
            to: 'settings',
            icon: 'gear',
            label: t('Nav.settings'),
            rx: settingsRoute
          }
        ]}
      />
      {Nav.renderExtra()}
    </UINav>
  )
}

Nav.renderExtra = () => null

export default React.memo(Nav)
