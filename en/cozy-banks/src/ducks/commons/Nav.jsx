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

import walletIcon from 'assets/icons/icon-wallet.svg'
import graphIcon from 'assets/icons/icon-graph.svg'
import transfersIcon from 'assets/icons/icon-transfers.svg'

/**
 * Returns true if `to` and `pathname` match
 * Supports `rx` for regex matches.
 */
const navLinkMatch = (rx, to, pathname) => {
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

const transferRoute = /\/transfers(\/.*)?/
const settingsRoute = /\/settings(\/.*)?/
const balancesRoute = /\/balances(\/.*)?/
const analysisRoute = /\/(categories|recurrence).*?/
const categoriesRoute = /\/categories(\/.*)?/
const recurrenceRoute = /\/recurrence(\/.*)?/

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
      <NavItems
        items={[
          {
            to: '/balances',
            icon: walletIcon,
            label: t('Nav.my-accounts'),
            rx: balancesRoute
          },
          {
            to: '/categories',
            icon: graphIcon,
            label: t('Nav.analysis'),
            rx: analysisRoute
          },
          {
            to: '/categories',
            label: t('Nav.categories'),
            rx: categoriesRoute,
            secondary: true
          },
          {
            to: '/recurrence',
            label: t('Nav.recurrence'),
            rx: recurrenceRoute,
            secondary: true
          },
          flag('/ransfers')
            ? {
                to: '/transfers',
                icon: transfersIcon,
                label: t('Transfer.nav'),
                rx: transferRoute
              }
            : null,
          {
            to: '/settings',
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
