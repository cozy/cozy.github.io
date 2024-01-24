import React, { useCallback, useState, useMemo, memo } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import sortBy from 'lodash/sortBy'
import cx from 'classnames'

import { useQuery } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Button from 'cozy-ui/transpiled/react/Button'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListSubheader from 'cozy-ui/transpiled/react/ListSubheader'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/ListItemSecondaryAction'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Radio from 'cozy-ui/transpiled/react/Radios'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'
import DropdownText from 'cozy-ui/transpiled/react/DropdownText'

import { AccountRowIcon } from 'ducks/balance/AccountRow'
import RawContentDialog from 'components/RawContentDialog'
import AccountSharingStatus from 'components/AccountSharingStatus'
import BarItem from 'components/BarItem'
import { BarCenter } from 'components/Bar'

import {
  filterByDoc,
  getFilteringDoc,
  resetFilterByDoc,
  getFilteredAccounts
} from 'ducks/filters'

import styles from 'ducks/account/AccountSwitch.styl'
import {
  ACCOUNT_DOCTYPE,
  GROUP_DOCTYPE,
  groupsConn,
  accountsConn
} from 'doctypes'
import { getGroupLabel } from 'ducks/groups/helpers'

import { getVirtualAccounts, getVirtualGroups } from 'selectors'
import {
  getAccountInstitutionLabel,
  getAccountLabel
} from 'ducks/account/helpers.js'

const filteringDocPropType = PropTypes.oneOfType([
  PropTypes.array,
  PropTypes.object
])

const getFilteringDocLabel = (filteringDoc, t) => {
  if (filteringDoc._type === ACCOUNT_DOCTYPE) {
    return getAccountLabel(filteringDoc, t)
  } else if (filteringDoc._type === GROUP_DOCTYPE) {
    return getGroupLabel(filteringDoc, t)
  }
}

const getFilteredAccountsLabel = (filteredAccounts, accounts, t) => {
  return t('AccountSwitch.some-accounts', {
    count: filteredAccounts.length,
    smart_count: accounts.length
  })
}

const getFilterLabel = (filteredAccounts, filteringDoc, accounts, t) => {
  if (accounts == null || accounts.length === 0) {
    return t('Categories.noAccount')
  }
  if (filteringDoc == null) {
    return t('AccountSwitch.all-accounts')
  }
  if (!Array.isArray(filteringDoc)) {
    return getFilteringDocLabel(filteringDoc, t)
  }
  return getFilteredAccountsLabel(filteredAccounts, accounts, t)
}

// t is passed from above and not through useI18n() since AccountSwitchSelect can be
// rendered in the Bar and in this case it has a different context
const AccountSwitchSelect = ({
  accounts,
  filteredAccounts,
  filteringDoc,
  onClick,
  t,
  typographyProps
}) => {
  return (
    <div className={styles.AccountSwitch__Select} onClick={onClick}>
      <DropdownText
        noWrap
        innerTextProps={{ variant: 'h1', ...typographyProps }}
      >
        {getFilterLabel(filteredAccounts, filteringDoc, accounts, t)}
      </DropdownText>
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
        <Radio onClick={props.onClick} checked={props.selected} readOnly />
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const AccountSwitchMenu = ({
  accounts,
  virtualAccounts,
  groups,
  virtualGroups,
  filteringDoc,
  filterByDoc,
  resetFilterByDoc
}) => {
  const { t } = useI18n()

  const handleReset = () => {
    resetFilterByDoc()
  }

  const accountExists = useCallback(
    accountId => {
      return accounts.find(account => account.id === accountId)
    },
    [accounts]
  )

  const sortedGroups = useMemo(() => {
    return sortBy([...groups, ...virtualGroups], g =>
      getGroupLabel(g, t).toLowerCase()
    )
  }, [groups, virtualGroups, t])

  const sortedAccounts = useMemo(() => {
    return sortBy(
      [...accounts, ...virtualAccounts],
      ['institutionLabel', a => getAccountLabel(a, t).toLowerCase()]
    )
  }, [accounts, virtualAccounts, t])

  return (
    <CozyTheme theme="normal">
      <List>
        <ListSubheader>{t('AccountSwitch.groups')}</ListSubheader>
        <AccountSwitchListItem
          dense
          button
          disableRipple
          divider
          onClick={handleReset}
          selected={!filteringDoc}
        >
          <AccountListItemText
            primary={t('AccountSwitch.all-accounts')}
            secondary={
              <>{t('AccountSwitch.account-counter', accounts.length)}</>
            }
          />
        </AccountSwitchListItem>
        {sortedGroups.map(group => (
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
                    'AccountSwitch.account-counter',
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
      <Button
        component="a"
        href="#/settings/groups"
        className="u-m-half"
        color="primary"
      >
        {t('Groups.manage-groups')}
      </Button>

      <List>
        <ListSubheader>{t('AccountSwitch.accounts')}</ListSubheader>
        {sortedAccounts.map((account, index) => (
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
              <AccountRowIcon account={account} />
            </ListItemIcon>
            <AccountListItemText
              primary={getAccountLabel(account, t)}
              secondary={getAccountInstitutionLabel(account)}
            />
            <ListItemSecondaryAction>
              <AccountSharingStatus tooltip account={account} />
            </ListItemSecondaryAction>
          </AccountSwitchListItem>
        ))}
      </List>
      <Button
        component="a"
        href="#/settings/accounts"
        className="u-m-half"
        color="primary"
      >
        {t('Accounts.manage-accounts')}
      </Button>
    </CozyTheme>
  )
}

AccountSwitchMenu.propTypes = {
  filterByDoc: PropTypes.func.isRequired,
  resetFilterByDoc: PropTypes.func.isRequired,
  filteringDoc: filteringDocPropType
}

const AccountSwitchWrapper = ({ children }) => {
  return <div className={cx(styles['account-switch'])}>{children}</div>
}

const barItemStyle = { overflow: 'hidden', paddingRight: '1rem' }

const selectPropsBySize = {
  normal: {
    typographyProps: {
      variant: 'body1'
    }
  },
  large: {
    typographyProps: {
      variant: 'h4'
    }
  },
  small: {
    typographyProps: {
      variant: 'caption'
    }
  }
}

// Note that everything is set up to be able to combine filters (even the redux store).
// It's only limited to one filter in a few places, because the UI can only accomodate one right now.
/**
 * Allows to select an account
 *
 * @param {String} options.size - Allows to define size of AccountSwitchSelect
 * @param {Number} options.insideBar - Allows to have the account switch select in BarCenter
 * @returns {JSX.Element}
 *
 */
const AccountSwitch = props => {
  const { size, insideBar } = props

  const accountsCollection = useQuery(accountsConn.query, accountsConn)
  const groupsCollection = useQuery(groupsConn.query, groupsConn)
  const [open, setOpen] = useState()
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const filteringDoc = useSelector(getFilteringDoc)
  const filteredAccounts = useSelector(getFilteredAccounts)
  const virtualAccounts = useSelector(getVirtualAccounts)
  const virtualGroups = useSelector(getVirtualGroups)

  const handleToggle = useCallback(
    ev => {
      ev.preventDefault()
      setOpen(open => !open)
    },
    [setOpen]
  )

  const handleClose = useCallback(
    ev => {
      ev && ev.preventDefault()
      setOpen(false)
    },
    [setOpen]
  )

  const dispatch = useDispatch()

  const handleFilterByDoc = useCallback(
    doc => {
      dispatch(filterByDoc(doc))
      handleClose()
    },
    [dispatch, handleClose]
  )

  const handleResetFilterByDoc = useCallback(() => {
    dispatch(resetFilterByDoc())
    handleClose()
  }, [dispatch, handleClose])

  const accounts = accountsCollection.data || []
  const groups = groupsCollection.data || []

  const selectProps = selectPropsBySize[size]
  const select = (
    <AccountSwitchSelect
      accounts={accounts}
      filteredAccounts={filteredAccounts}
      filteringDoc={filteringDoc}
      onClick={handleToggle}
      t={t}
      {...selectProps}
    />
  )
  return (
    <AccountSwitchWrapper>
      {isMobile && insideBar !== false ? (
        <BarCenter>
          <BarItem style={barItemStyle}>{select}</BarItem>
        </BarCenter>
      ) : (
        select
      )}
      {open && (
        <CozyTheme variant="normal">
          <RawContentDialog
            open={true}
            onClose={handleClose}
            title={t('AccountSwitch.title')}
            content={
              <AccountSwitchMenu
                filteringDoc={filteringDoc}
                filterByDoc={handleFilterByDoc}
                resetFilterByDoc={handleResetFilterByDoc}
                close={handleClose}
                groups={groups}
                virtualGroups={virtualGroups}
                accounts={accounts}
                virtualAccounts={virtualAccounts}
              />
            }
          />
        </CozyTheme>
      )}
    </AccountSwitchWrapper>
  )
}

AccountSwitch.propTypes = {
  insideBar: PropTypes.bool
}

AccountSwitch.defaultProps = {
  size: 'large',
  insideBar: true
}

export default memo(AccountSwitch)
