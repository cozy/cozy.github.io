import React from 'react'
import { translate } from 'cozy-ui/react'
import cx from 'classnames'
import UINav, {
  NavItem,
  NavIcon,
  NavText,
  genNavLink,
  NavLink as UINavLink
} from 'cozy-ui/react/Nav'
import { Link, withRouter } from 'react-router'
import flag from 'cozy-flags'

import wallet from 'assets/icons/icon-wallet.svg'
import graph from 'assets/icons/icon-graph.svg'
import transfers from 'assets/icons/icon-transfers.svg'

const NavLink = genNavLink(Link)

export const RegexNavLink = React.memo(
  withRouter(props => (
    <a
      href={`#/${props.to}`}
      className={cx(
        UINavLink.className,
        props.rx.test(props.location.pathname)
          ? UINavLink.activeClassName
          : null
      )}
    >
      {props.children}
    </a>
  ))
)

const transferRoute = /\/transfers\/.*/

export const Nav = ({ t }) => (
  <UINav>
    <NavItem>
      <NavLink to="balances">
        <NavIcon icon={wallet} />
        <NavText>{t('Nav.my-accounts')}</NavText>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink to="categories">
        <NavIcon icon={graph} />
        <NavText>{t('Nav.categorisation')}</NavText>
      </NavLink>
    </NavItem>
    {flag('transfers') ? (
      <NavItem>
        <RegexNavLink to="transfers" rx={transferRoute}>
          <NavIcon icon={transfers} />
          <NavText>{t('Transfer.nav')}</NavText>
        </RegexNavLink>
      </NavItem>
    ) : null}
    <NavItem>
      <NavLink to="settings">
        <NavIcon icon="gear" />
        <NavText>{t('Nav.settings')}</NavText>
      </NavLink>
    </NavItem>
    {Nav.renderExtra()}
  </UINav>
)

Nav.renderExtra = () => null

export default React.memo(translate()(Nav))
