import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import CozyClient, { queryConnect } from 'cozy-client'
import cx from 'classnames'
import compose from 'lodash/flowRight'

import Icon from 'cozy-ui/transpiled/react/Icon'
import Switch from 'cozy-ui/transpiled/react/MuiCozyTheme/Switch'
import Figure from 'cozy-ui/transpiled/react/Figure'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

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
import { triggersConn } from 'doctypes'
import { Contact } from 'cozy-doctypes'
import AccountCaption from 'ducks/balance/AccountRowCaption'

const Number = React.memo(function Number({ account }) {
  return (
    <div
      className={cx(
        styles.AccountRow__column,
        styles['AccountRow__column--secondary']
      )}
    >
      N°
      {account.number}
    </div>
  )
})

const Owners = React.memo(function Owners(props) {
  const { owners, ...rest } = props

  return (
    <div {...rest}>
      <Icon
        icon={owners.length > 1 ? 'team' : 'people'}
        size={10}
        className={styles.AccountRow__ownersIcon}
      />
      {owners.map(Contact.getDisplayName).join(' - ')}
    </div>
  )
})

const OwnersColumn = props => {
  const { owners, ...rest } = props

  return (
    <div
      className={cx(
        styles.AccountRow__column,
        styles['AccountRow__column--secondary']
      )}
      {...rest}
    >
      {owners && owners.length > 0 ? <Owners owners={owners} /> : null}
    </div>
  )
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
    triggersCol
  } = props
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()

  const owners = account.owners.data.filter(Boolean).filter(owner => !owner.me)

  const shouldShowOwners = owners.length > 0

  const hasAlert = account.balance < 0
  const accountLabel = getAccountLabel(account)

  const showUpdatedAtOutside = isMobile && shouldShowOwners

  const handleSwitchClick = useCallback(ev => {
    ev.stopPropagation()
  }, [])

  return (
    <li
      className={cx(styles.AccountRow, 'u-clickable', {
        [styles['AccountRow--hasWarning']]: hasWarning,
        [styles['AccountRow--hasAlert']]: hasAlert,
        [styles['AccountRow--disabled']]:
          (!checked || disabled) && account.loading !== true,
        [styles['AccountRow--withOwners']]: shouldShowOwners
      })}
      onClick={onClick}
    >
      <div className={styles.AccountRow__mainLine}>
        <div className={styles.AccountRow__column}>
          <div className={styles.AccountRow__logo}>
            {isReimbursementsAccount(account) ? (
              <ReimbursementsIcon account={account} />
            ) : (
              <AccountIcon account={account} />
            )}
          </div>

          <div className={styles.AccountRow__labelWrapper}>
            <div className={styles.AccountRow__label}>
              {account.virtual ? t(accountLabel) : accountLabel}
            </div>
            {shouldShowOwners && isMobile && (
              <Owners className={styles.AccountRow__subText} owners={owners} />
            )}
            {!showUpdatedAtOutside && (
              <AccountCaption triggersCol={triggersCol} account={account} />
            )}
          </div>
        </div>
        {!isMobile && <OwnersColumn owners={owners} />}
        {!isMobile && account.number && <Number account={account} />}
        {!isMobile && (
          <div
            className={cx(
              styles.AccountRow__column,
              styles['AccountRow__column--secondary']
            )}
          >
            {getAccountInstitutionLabel(account)}
          </div>
        )}
        <div
          className={cx(
            styles.AccountRow__column,
            styles.AccountRow__figureSwitchWrapper
          )}
        >
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
        </div>
      </div>
      {showUpdatedAtOutside && (
        <div className={styles.AccountRow__subLine}>
          <AccountCaption triggersCol={triggersCol} account={account} />
        </div>
      )}
    </li>
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

export default compose(
  queryConnect({
    triggersCol: {
      ...triggersConn,
      fetchPolicy: CozyClient.fetchPolicies.noFetch
    }
  }),
  connect((state, { account }) => {
    const warningLimits = getWarningLimitPerAccount(state)
    const accountLimit = warningLimits[account._id]
    return {
      hasWarning: accountLimit ? accountLimit > account.balance : false
    }
  }),
  React.memo
)(AccountRow)
