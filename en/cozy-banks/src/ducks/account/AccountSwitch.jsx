/* global cozy */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { flowRight as compose, sortBy } from 'lodash'
import cx from 'classnames'
import { translate, withBreakpoints } from 'cozy-ui/react'
import Icon from 'cozy-ui/react/Icon'
import { Media, Bd, Img } from 'cozy-ui/react/Media'
import Overlay from 'cozy-ui/react/Overlay'
import Portal from 'cozy-ui/react/Portal'
import flag from 'cozy-flags'
import { createStructuredSelector } from 'reselect'

import AccountSharingStatus from 'components/AccountSharingStatus'
import AccountIcon from 'components/AccountIcon'
import BarItem from 'components/BarItem'
import Title from 'components/Title'

import {
  filterByDoc,
  getFilteringDoc,
  resetFilterByDoc,
  getFilteredAccounts
} from 'ducks/filters'
import styles from 'ducks/account/AccountSwitch.styl'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import { queryConnect } from 'cozy-client'

import { getGroupLabel } from 'ducks/groups/helpers'
import { getVirtualGroups } from 'selectors'

import {
  getAccountInstitutionLabel,
  getAccountLabel
} from 'ducks/account/helpers.js'

const { BarCenter } = cozy.bar

const AccountSwitchDesktop = translate()(
  ({
    isFetching,
    isOpen,
    filteringDoc,
    accounts,
    t,
    toggle,
    accountExists
  }) => (
    <button
      className={cx(
        styles['account-switch-button'],
        { [styles['active']]: isOpen },
        'coz-desktop'
      )}
      onClick={toggle}
    >
      {isFetching ? (
        `${t('Loading.loading')}`
      ) : filteringDoc ? (
        <div>
          <div className={styles['account-name']}>
            {filteringDoc.shortLabel || filteringDoc.label}{' '}
            <AccountSharingStatus account={filteringDoc} />
          </div>
          <div className={styles['account-num']}>
            {filteringDoc.number && 'n°' + filteringDoc.number}
            {filteringDoc.accounts &&
              t(
                'AccountSwitch.account_counter',
                filteringDoc.accounts.raw.filter(accountExists).length
              )}
          </div>
        </div>
      ) : (
        <div>
          <div className={styles['account-name']}>
            {t('AccountSwitch.all_accounts')}
            <div className={styles['account-num']}>
              {t('AccountSwitch.account_counter', accounts.length)}
            </div>
          </div>
        </div>
      )}
    </button>
  )
)

AccountSwitchDesktop.propTypes = {
  filteringDoc: PropTypes.object
}

const DownArrow = ({ color }) => (
  <Icon
    width={12}
    height={12}
    icon="bottom"
    className={cx(styles.DownArrow, styles[`DownArrowColor_${color}`])}
  />
)

DownArrow.propTypes = {
  color: PropTypes.oneOf(['default', 'primary'])
}

const getFilteringDocLabel = (filteringDoc, t, accounts) => {
  if (filteringDoc.length) {
    return t('AccountSwitch.some_accounts', {
      count: filteringDoc.length,
      smart_count: accounts.length
    })
  } else if (filteringDoc._type === ACCOUNT_DOCTYPE) {
    return getAccountLabel(filteringDoc)
  } else if (filteringDoc._type === GROUP_DOCTYPE) {
    return getGroupLabel(filteringDoc, t)
  }
}

const AccountSwitchSelect = translate()(
  ({ accounts, filteringDoc, onClick, t, color }) => (
    <div
      className={cx(
        styles.AccountSwitch__Select,
        styles[`AccountSwitchColor_${color}`]
      )}
      onClick={onClick}
    >
      {flag('account-switch.display-icon') &&
      filteringDoc._type === ACCOUNT_DOCTYPE ? (
        <span className="u-mr-1">
          <AccountIcon account={filteringDoc} />
        </span>
      ) : null}
      <Title className={styles.AccountSwitch__SelectText} color={color}>
        {filteringDoc
          ? getFilteringDocLabel(filteringDoc, t, accounts)
          : t('AccountSwitch.all_accounts')}
      </Title>
      <DownArrow color={color} />
    </div>
  )
)

AccountSwitchSelect.propTypes = {
  color: PropTypes.oneOf(['default', 'primary'])
}

AccountSwitchSelect.defaultProps = {
  color: 'default'
}

const AccountSwitchMobile = ({
  filteredAccounts,
  filteringDoc,
  onClick,
  color
}) => (
  <AccountSwitchSelect
    filteringAccounts={filteredAccounts}
    filteringDoc={filteringDoc}
    onClick={onClick}
    color={color}
  />
)

AccountSwitchMobile.propTypes = {
  filteringDoc: PropTypes.object,
  onClick: PropTypes.func.isRequired,
  filteredAccounts: PropTypes.array.isRequired
}

const AccountSwitchTablet = ({ filteringDoc, onClick }) => (
  <button
    className={cx(styles['account-switch-button-mobile'], {
      [styles['active']]: filteringDoc
    })}
    onClick={onClick}
  />
)

AccountSwitchTablet.propTypes = {
  filteringDoc: PropTypes.object,
  onClick: PropTypes.func.isRequired
}

const AccountSwitchMenu = translate()(
  ({
    accounts,
    groups,
    filteringDoc,
    filterByDoc,
    resetFilterByDoc,
    t,
    accountExists,
    close
  }) => (
    <div className={styles['account-switch-menu-content']}>
      <div className={styles['account-switch-menu']}>
        <h4>{t('AccountSwitch.groups')}</h4>
        <ul>
          <li>
            <button
              onClick={() => {
                resetFilterByDoc()
              }}
              className={cx({
                [styles['active']]: filteringDoc === undefined
              })}
            >
              {t('AccountSwitch.all_accounts')}
              <span className={styles['account-secondary-info']}>
                ({t('AccountSwitch.account_counter', accounts.length)})
              </span>
            </button>
          </li>
          {sortBy(groups, 'label').map(group => (
            <li key={group._id}>
              <button
                onClick={() => {
                  filterByDoc(group)
                }}
                className={cx({
                  [styles['active']]:
                    filteringDoc && group._id === filteringDoc._id
                })}
              >
                {getGroupLabel(group, t)}
                <span className={styles['account-secondary-info']}>
                  (
                  {t(
                    'AccountSwitch.account_counter',
                    group.accounts.data.filter(
                      account => account && accountExists(account.id)
                    ).length
                  )}
                  )
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link to={'/settings/groups'} onClick={close}>
          {t('Groups.manage-groups')}
        </Link>

        <hr />

        <h4>{t('AccountSwitch.accounts')}</h4>
        <ul>
          {sortBy(accounts, ['institutionLabel', 'label']).map(
            (account, index) => (
              <li key={index}>
                <button
                  onClick={() => {
                    filterByDoc(account)
                  }}
                  className={cx({
                    [styles['active']]:
                      filteringDoc && account._id === filteringDoc._id
                  })}
                >
                  <Media>
                    <Bd>
                      {account.shortLabel || account.label}
                      <span className={styles['account-secondary-info']}>
                        - {getAccountInstitutionLabel(account)}
                      </span>
                    </Bd>
                    <Img>
                      <AccountSharingStatus tooltip account={account} />
                    </Img>
                  </Media>
                </button>
              </li>
            )
          )}
        </ul>
        <Link to={'/settings/accounts'} onClick={close}>
          {t('Accounts.manage-accounts')}
        </Link>
      </div>
    </div>
  )
)

AccountSwitchMenu.propTypes = {
  filterByDoc: PropTypes.func.isRequired,
  resetFilterByDoc: PropTypes.func.isRequired,
  filteringDoc: PropTypes.object
}

const barItemStyle = { overflow: 'hidden', paddingRight: '1rem' }

// Note that everything is set up to be able to combine filters (even the redux store).
// It's only limited to one filter in a few places, because the UI can only accomodate one right now.
class AccountSwitch extends Component {
  state = {
    open: false
  }

  close = () => {
    if (this.state.open) {
      this.setState({ open: false })
    }
  }

  toggle = () => {
    let newState = !this.state.open
    this.setState({
      open: newState
    })
  }

  accountExists = accountId => {
    const accounts = this.props.accounts.data
    return accounts.find(account => account.id === accountId)
  }

  render() {
    const {
      t,
      filteringDoc,
      filterByDoc,
      filteredAccounts,
      resetFilterByDoc,
      breakpoints: { isMobile },
      small,
      color,
      accounts: accountsCollection,
      groups: groupsCollection,
      virtualGroups
    } = this.props
    const { open } = this.state

    const accounts = accountsCollection.data
    const groups = [...groupsCollection.data, ...virtualGroups].map(group => ({
      ...group,
      label: getGroupLabel(group, t)
    }))

    if (!accounts || accounts.length === 0) {
      return isMobile ? (
        <BarCenter>
          <BarItem style={barItemStyle}>
            <Title
              className={cx(styles.AccountSwitch__SelectText, styles.disable)}
              color={color}
            >
              {t('Categories.noAccount')}
            </Title>
          </BarItem>
        </BarCenter>
      ) : (
        <Title
          className={cx(styles.AccountSwitch__SelectText, styles.disable)}
          color={color}
        >
          {t('Categories.noAccount')}
        </Title>
      )
    }

    const closeAfterSelect = selection => param => {
      selection(param)
      this.close()
    }

    // It seems there is a bug in cozy-client when we delete a document
    // The document is removed in the store, but still referenced in the collection
    // So we may get an undefined group. We filter it before sorting
    const orderedGroups = sortBy(groups.filter(Boolean), x =>
      x.label.toLowerCase()
    )
    return (
      <div
        className={cx(
          styles['account-switch'],
          styles[`account-switch_${color}`],
          {
            [styles['AccountSwitch--small']]: small
          }
        )}
      >
        {isMobile ? (
          <BarCenter>
            <BarItem style={barItemStyle}>
              <AccountSwitchSelect
                accounts={accounts}
                filteredAccounts={filteredAccounts}
                filteringDoc={filteringDoc}
                onClick={this.toggle}
                t={t}
                color={color}
              />
            </BarItem>
          </BarCenter>
        ) : (
          <AccountSwitchSelect
            accounts={accounts}
            filteredAccounts={filteredAccounts}
            filteringDoc={filteringDoc}
            onClick={this.toggle}
            color={color}
            t={t}
          />
        )}
        {open && (
          <Portal into="body">
            <Overlay onClick={this.close}>
              <AccountSwitchMenu
                filteringDoc={filteringDoc}
                filterByDoc={closeAfterSelect(filterByDoc)}
                resetFilterByDoc={closeAfterSelect(resetFilterByDoc)}
                close={this.close}
                groups={orderedGroups}
                accounts={accounts}
                accountExists={this.accountExists}
              />
            </Overlay>
          </Portal>
        )}
      </div>
    )
  }
}

AccountSwitch.propTypes = {
  filterByDoc: PropTypes.func.isRequired,
  resetFilterByDoc: PropTypes.func.isRequired,
  filteringDoc: PropTypes.object,
  color: PropTypes.oneOf(['default', 'primary'])
}

AccountSwitch.defaultProps = {
  small: false,
  color: 'default'
}

const mapStateToProps = createStructuredSelector({
  filteringDoc: getFilteringDoc,
  filteredAccounts: getFilteredAccounts,
  virtualGroups: getVirtualGroups
})

const mapDispatchToProps = dispatch => ({
  resetFilterByDoc: () => dispatch(resetFilterByDoc()),
  filterByDoc: doc => dispatch(filterByDoc(doc))
})

export default compose(
  queryConnect({
    accounts: { query: client => client.all(ACCOUNT_DOCTYPE), as: 'accounts' },
    groups: { query: client => client.all(GROUP_DOCTYPE), as: 'groups' }
  }),
  translate(),
  withBreakpoints(),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(AccountSwitch)
