import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import compose from 'lodash/flowRight'
import sortBy from 'lodash/sortBy'
import cx from 'classnames'

import { translate, useI18n } from 'cozy-ui/transpiled/react/I18n'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Button from 'cozy-ui/transpiled/react/Button'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListSubheader from 'cozy-ui/transpiled/react/MuiCozyTheme/ListSubheader'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemSecondaryAction'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Radio from 'cozy-ui/transpiled/react/Radio'

import flag from 'cozy-flags'
import { createStructuredSelector } from 'reselect'

import RawContentDialog from 'components/RawContentDialog'
import AccountSharingStatus from 'components/AccountSharingStatus'
import AccountIcon from 'components/AccountIcon'
import BarItem from 'components/BarItem'
import Title from 'components/Title'

import { useCozyTheme } from 'cozy-ui/transpiled/react/CozyTheme'

import {
  filterByDoc,
  getFilteringDoc,
  resetFilterByDoc,
  getFilteredAccounts
} from 'ducks/filters'
import styles from 'ducks/account/AccountSwitch.styl'
import { ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import { queryConnect, Q } from 'cozy-client'

import { getGroupLabel } from 'ducks/groups/helpers'
import { getVirtualGroups } from 'selectors'

import {
  getAccountInstitutionLabel,
  getAccountLabel
} from 'ducks/account/helpers.js'

import { BarCenter } from 'components/Bar'

import BottomIcon from 'cozy-ui/transpiled/react/Icons/Bottom'

const filteringDocPropType = PropTypes.oneOfType([
  PropTypes.array,
  PropTypes.object
])

const AccountSwitchDesktop = ({
  isFetching,
  isOpen,
  filteringDoc,
  accounts,
  toggle,
  accountExists
}) => {
  const { t } = useI18n()

  return (
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
}

AccountSwitchDesktop.propTypes = {
  filteringDoc: filteringDocPropType
}

const DownArrow = () => {
  const theme = useCozyTheme()
  return (
    <Icon
      width={12}
      height={12}
      icon={BottomIcon}
      className={cx(styles.DownArrow, styles[`DownArrowColor_${theme}`])}
    />
  )
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

// t is passed from above and not through useI18n() since AccountSwitchSelect can be
// rendered in the Bar and in this case it has a different context
const AccountSwitchSelect = ({ accounts, filteringDoc, onClick, t }) => {
  return (
    <div className={styles.AccountSwitch__Select} onClick={onClick}>
      {flag('account-switch.display-icon') &&
      filteringDoc._type === ACCOUNT_DOCTYPE ? (
        <span className="u-mr-1">
          <AccountIcon account={filteringDoc} />
        </span>
      ) : null}
      <Title className={styles.AccountSwitch__SelectText}>
        {filteringDoc
          ? getFilteringDocLabel(filteringDoc, t, accounts)
          : t('AccountSwitch.all_accounts')}
      </Title>
      <DownArrow />
    </div>
  )
}

AccountSwitchSelect.propTypes = {
  t: PropTypes.func.isRequired
}

const accountListItemTextTypo2Props = {
  variant: 'caption',
  color: 'textSecondary'
}

const AccountListItemText = ({ primary, secondary }) => {
  return (
    <ListItemText
      primary={primary}
      secondary={secondary}
      secondaryTypographyProps={accountListItemTextTypo2Props}
    />
  )
}

const AccountSwitchListItem = props => {
  return (
    <ListItem {...props}>
      {props.children}
      <ListItemSecondaryAction className="u-pr-1">
        <Radio onClick={props.onClick} checked={props.selected} />
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const AccountSwitchMenu = ({
  accounts,
  groups,
  filteringDoc,
  filterByDoc,
  resetFilterByDoc,
  accountExists,
  close
}) => {
  const { t } = useI18n()

  const handleReset = () => {
    resetFilterByDoc()
  }

  return (
    <>
      <List>
        <ListSubheader>{t('AccountSwitch.groups')}</ListSubheader>
        <AccountSwitchListItem
          dense
          button
          disableRipple
          onClick={handleReset}
          selected={filteringDoc === undefined}
        >
          <AccountListItemText
            primary={t('AccountSwitch.all_accounts')}
            secondary={
              <>{t('AccountSwitch.account_counter', accounts.length)}</>
            }
          />
        </AccountSwitchListItem>
        {sortBy(groups, 'label').map(group => (
          <AccountSwitchListItem
            dense
            key={group._id}
            button
            disableRipple
            selected={filteringDoc && group._id === filteringDoc._id}
            onClick={() => {
              filterByDoc(group)
            }}
          >
            <AccountListItemText
              primary={getGroupLabel(group, t)}
              secondary={
                <>
                  {t(
                    'AccountSwitch.account_counter',
                    group.accounts.data.filter(
                      account => account && accountExists(account.id)
                    ).length
                  )}
                </>
              }
            />
          </AccountSwitchListItem>
        ))}
      </List>
      <Link to={'/settings/groups'} onClick={close}>
        <Button
          className="u-m-half"
          theme="text"
          label={t('Groups.manage-groups')}
        />
      </Link>

      <List>
        <ListSubheader>{t('AccountSwitch.accounts')}</ListSubheader>
        {sortBy(accounts, ['institutionLabel', 'label']).map(
          (account, index) => (
            <AccountSwitchListItem
              key={index}
              button
              disableRipple
              dense
              onClick={() => {
                filterByDoc(account)
              }}
              selected={filteringDoc && account._id === filteringDoc._id}
            >
              <ListItemIcon>
                <AccountIcon account={account} />
              </ListItemIcon>
              <AccountListItemText
                primary={account.shortLabel || account.label}
                secondary={getAccountInstitutionLabel(account)}
              />
              <ListItemSecondaryAction>
                <AccountSharingStatus tooltip account={account} />
              </ListItemSecondaryAction>
            </AccountSwitchListItem>
          )
        )}
      </List>
      <Link to="/settings/accounts" onClick={close}>
        <Button
          className="u-m-half"
          theme="text"
          label={t('Accounts.manage-accounts')}
        />
      </Link>
    </>
  )
}

AccountSwitchMenu.propTypes = {
  filterByDoc: PropTypes.func.isRequired,
  resetFilterByDoc: PropTypes.func.isRequired,
  filteringDoc: filteringDocPropType
}

const AccountSwitchWrapper = ({ small, children }) => {
  return (
    <div
      className={cx(styles['account-switch'], {
        [styles['AccountSwitch--small']]: small
      })}
    >
      {children}
    </div>
  )
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
            >
              {t('Categories.noAccount')}
            </Title>
          </BarItem>
        </BarCenter>
      ) : (
        <Title className={cx(styles.AccountSwitch__SelectText, styles.disable)}>
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
      <AccountSwitchWrapper small={small}>
        {isMobile ? (
          <BarCenter>
            <BarItem style={barItemStyle}>
              <AccountSwitchSelect
                accounts={accounts}
                filteredAccounts={filteredAccounts}
                filteringDoc={filteringDoc}
                onClick={this.toggle}
                t={t}
              />
            </BarItem>
          </BarCenter>
        ) : (
          <AccountSwitchSelect
            accounts={accounts}
            filteredAccounts={filteredAccounts}
            filteringDoc={filteringDoc}
            onClick={this.toggle}
            t={t}
          />
        )}
        {open && (
          <RawContentDialog
            open={true}
            onClose={this.close}
            title={t('AccountSwitch.title')}
            content={
              <AccountSwitchMenu
                filteringDoc={filteringDoc}
                filterByDoc={closeAfterSelect(filterByDoc)}
                resetFilterByDoc={closeAfterSelect(resetFilterByDoc)}
                close={this.close}
                groups={orderedGroups}
                accounts={accounts}
                accountExists={this.accountExists}
              />
            }
          />
        )}
      </AccountSwitchWrapper>
    )
  }
}

AccountSwitch.propTypes = {
  filterByDoc: PropTypes.func.isRequired,
  resetFilterByDoc: PropTypes.func.isRequired,
  filteringDoc: filteringDocPropType
}

AccountSwitch.defaultProps = {
  small: false
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
    accounts: { query: () => Q(ACCOUNT_DOCTYPE), as: 'accounts' },
    groups: { query: () => Q(GROUP_DOCTYPE), as: 'groups' }
  }),
  translate(),
  withBreakpoints(),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(AccountSwitch)
