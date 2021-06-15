import React, { useCallback, useState, useMemo, memo } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import sortBy from 'lodash/sortBy'
import cx from 'classnames'

import { useQuery } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Button from 'cozy-ui/transpiled/react/MuiCozyTheme/Buttons'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListSubheader from 'cozy-ui/transpiled/react/MuiCozyTheme/ListSubheader'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemSecondaryAction'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Radio from 'cozy-ui/transpiled/react/Radio'
import BottomIcon from 'cozy-ui/transpiled/react/Icons/Bottom'
import Typography from 'cozy-ui/transpiled/react/Typography'
import CozyTheme, { useCozyTheme } from 'cozy-ui/transpiled/react/CozyTheme'

import RawContentDialog from 'components/RawContentDialog'
import AccountSharingStatus from 'components/AccountSharingStatus'
import AccountIcon from 'components/AccountIcon'
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

import { getVirtualGroups } from 'selectors'
import {
  getAccountInstitutionLabel,
  getAccountLabel
} from 'ducks/account/helpers.js'

const filteringDocPropType = PropTypes.oneOfType([
  PropTypes.array,
  PropTypes.object
])

const DownArrow = ({ size }) => {
  const theme = useCozyTheme()
  return (
    <Icon
      width={size}
      height={size}
      icon={BottomIcon}
      className={cx(styles.DownArrow, styles[`DownArrowColor_${theme}`])}
    />
  )
}

DownArrow.defaultProps = {
  size: 12
}

const getFilteringDocLabel = (filteringDoc, t, accounts) => {
  if (filteringDoc.length) {
    return t('AccountSwitch.some-accounts', {
      count: filteringDoc.length,
      smart_count: accounts.length
    })
  } else if (filteringDoc._type === ACCOUNT_DOCTYPE) {
    return getAccountLabel(filteringDoc)
  } else if (filteringDoc._type === GROUP_DOCTYPE) {
    return getGroupLabel(filteringDoc, t)
  }
}

const defaultTypographyProps = {
  color: 'primary',
  variant: 'h4'
}

// t is passed from above and not through useI18n() since AccountSwitchSelect can be
// rendered in the Bar and in this case it has a different context
const AccountSwitchSelect = ({
  accounts,
  filteringDoc,
  onClick,
  t,
  typographyProps,
  arrowProps
}) => {
  const noAccounts = !accounts || accounts.length === 0

  return (
    <div className={styles.AccountSwitch__Select} onClick={onClick}>
      <Typography
        className={cx(styles.AccountSwitch__SelectText, 'u-ellipsis')}
        {...defaultTypographyProps}
        {...typographyProps}
      >
        {noAccounts
          ? t('Categories.noAccount')
          : filteringDoc
          ? getFilteringDocLabel(filteringDoc, t, accounts)
          : t('AccountSwitch.all-accounts')}
      </Typography>
      <DownArrow {...arrowProps} />
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
  groups,
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
    return sortBy(groups, g => getGroupLabel(g, t))
  }, [groups, t])

  const sortedAccounts = useMemo(() => {
    return sortBy(accounts, ['institutionLabel', getAccountLabel])
  }, [accounts])

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
      variant: 'body1',
      color: 'primary'
    }
  },
  large: {
    typographyProps: {
      variant: 'h4',
      color: 'primary'
    },
    arrowProps: {
      size: 16
    }
  },
  small: {
    typographyProps: {
      variant: 'caption',
      color: 'primary'
    },
    arrowProps: {
      size: 10
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

  const accounts = accountsCollection.data

  const orderedGroups = useMemo(() => {
    const groups = [...(groupsCollection.data || []), ...virtualGroups].map(
      group => ({
        ...group,
        label: getGroupLabel(group, t)
      })
    )
    // TODO remove the filter if https://github.com/cozy/cozy-client/issues/834 is solved
    // It seems there is a bug in cozy-client when we delete a document
    // The document is removed in the store, but still referenced in the collection
    // So we may get an undefined group. We filter it before sorting
    return sortBy(groups.filter(Boolean), x => x.label.toLowerCase())
  }, [groupsCollection.data, t, virtualGroups])

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
                groups={orderedGroups}
                accounts={accounts}
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
