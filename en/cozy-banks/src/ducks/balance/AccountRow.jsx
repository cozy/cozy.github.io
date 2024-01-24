import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import cx from 'classnames'
import compose from 'lodash/flowRight'
import isEqual from 'lodash/isEqual'
import flag from 'cozy-flags'

import { withStyles } from 'cozy-ui/transpiled/react/styles'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Switch from 'cozy-ui/transpiled/react/Switch'
import Figure from 'cozy-ui/transpiled/react/Figure'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Typography from 'cozy-ui/transpiled/react/Typography'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import { Contact } from 'cozy-doctypes'

import {
  getAccountLabel,
  getAccountInstitutionLabel,
  getAccountBalance,
  isReimbursementsAccount
} from 'ducks/account/helpers'
import { getWarningLimitPerAccount } from 'selectors'
import styles from 'ducks/balance/AccountRow.styl'
import ReimbursementsIcon from 'ducks/balance/ReimbursementsIcon'
import AccountIcon from 'components/AccountIcon'
import AccountCaption from 'ducks/balance/AccountRowCaption'
import useVisible from 'hooks/useVisible'

const Owners = React.memo(function Owners(props) {
  const { owners } = props

  return (
    <>
      <Icon
        icon={owners.length > 1 ? 'team' : 'people'}
        size={10}
        className={styles.AccountRow__ownersIcon}
      />
      {owners.map(Contact.getDisplayName).join(' - ')}
    </>
  )
})

export const AccountRowIcon = ({ account }) => {
  return isReimbursementsAccount(account) ? (
    <ReimbursementsIcon account={account} />
  ) : (
    <AccountIcon account={account} />
  )
}

const ListItemTextColumn = withStyles({
  root: {
    flexBasis: '100%',
    paddingRight: '1rem'
  }
})(ListItemText)

const PrimaryColumn = withStyles({
  root: {
    flexBasis: '200%' // Primary column is twice as large as other columns
  }
})(ListItemTextColumn)

const ActionListItemTextColumn = withStyles(theme => ({
  root: {
    justifyContent: 'flex-end',
    display: 'flex',
    alignItems: 'center',
    marginRight: '-0.5rem',
    paddingRight: 0,
    [theme.breakpoints.down('sm')]: {
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto'
    }
  }
}))(ListItemTextColumn)

const secondaryColumnPrimaryTypographyProps = {
  color: 'textSecondary',
  variant: 'body2',
  className: 'u-ellipsis'
}
const SecondaryColumn = props => {
  return (
    <ListItemTextColumn
      primaryTypographyProps={secondaryColumnPrimaryTypographyProps}
      {...props}
    />
  )
}

const EllipseTypography = withStyles({
  root: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
})(Typography)

const observerOptions = {
  threshold: [0, 1]
}

const AccountRow = props => {
  const {
    account,
    onClick,
    hasWarning,
    checked,
    disabled,
    onSwitchChange,
    id,
    initialVisible,
    triggers
  } = props

  const [ref, visible] = useVisible(
    flag('banks.balance.account-row-skeleton') ? initialVisible : true,
    observerOptions
  )
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const owners = account.owners.data.filter(Boolean).filter(owner => !owner.me)
  const hasOwners = owners.length > 0
  const hasAlert = account.balance < 0
  const accountLabel = getAccountLabel(account, t)
  const handleSwitchClick = useCallback(ev => {
    ev.stopPropagation()
  }, [])
  const handleClick = useCallback(
    ev => onClick(ev, account),
    [account, onClick]
  )

  const classes = {
    root: cx({
      'u-pr-half': isMobile,
      [styles['AccountRow--hasWarning']]: hasWarning,
      [styles['AccountRow--hasAlert']]: hasAlert,
      [styles['AccountRow--disabled']]:
        (!checked || disabled) && account.loading !== true
    })
  }

  if (!visible) {
    return (
      <ListItem ref={ref} classes={classes} onClick={handleClick}>
        <ListItemIcon />
        <ListItemText primary={t('Loading.loading')} secondary="&nbsp;" />
      </ListItem>
    )
  }

  return (
    <ListItem ref={ref} button classes={classes} onClick={handleClick}>
      <ListItemIcon>
        <AccountRowIcon account={account} />
      </ListItemIcon>
      <PrimaryColumn disableTypography>
        <EllipseTypography
          variant="body1"
          color={disabled ? 'textSecondary' : 'textPrimary'}
        >
          {accountLabel}
        </EllipseTypography>
        <AccountCaption
          gutterBottom={isMobile && hasOwners}
          account={account}
          triggers={triggers}
        />
        {isMobile && hasOwners ? (
          <Typography variant="caption" color="textSecondary">
            <Owners owners={owners} />
          </Typography>
        ) : null}
      </PrimaryColumn>
      {!isMobile && hasOwners ? (
        <SecondaryColumn>
          <Owners variant="body2" owners={owners} />
        </SecondaryColumn>
      ) : null}
      {!isMobile ? (
        <SecondaryColumn>
          {account.number ? `N°${account.number}` : null}
        </SecondaryColumn>
      ) : null}
      {!isMobile ? (
        <SecondaryColumn>{getAccountInstitutionLabel(account)}</SecondaryColumn>
      ) : null}
      <ActionListItemTextColumn disableTypography>
        <Figure
          symbol="€"
          total={getAccountBalance(account)}
          className={cx(styles.AccountRow__figure)}
          totalClassName={styles.AccountRow__figure}
          currencyClassName={styles.AccountRow__figure}
        />
        {/* color: Do not deactivate interactions with the button,
          only color it to look disabled */}
        <Switch
          disableRipple
          checked={checked}
          color={disabled ? 'default' : 'primary'}
          onClick={handleSwitchClick}
          id={id}
          onChange={onSwitchChange}
        />
      </ActionListItemTextColumn>
    </ListItem>
  )
}

AccountRow.propTypes = {
  account: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  hasWarning: PropTypes.bool.isRequired,
  checked: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  onSwitchChange: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired
}

const MemoAccountRow = React.memo(props => {
  return <AccountRow {...props} />
}, isEqual)

export default compose(
  connect((state, { account }) => {
    const warningLimits = getWarningLimitPerAccount(state)
    const accountLimit = warningLimits[account._id]
    return {
      hasWarning: accountLimit ? accountLimit > account.balance : false
    }
  })
)(MemoAccountRow)
