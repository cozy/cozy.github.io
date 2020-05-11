import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import CozyClient, { queryConnect, withClient } from 'cozy-client'
import { withBreakpoints, translate, useI18n } from 'cozy-ui/transpiled/react'
import flag from 'cozy-flags'
import Icon from 'cozy-ui/transpiled/react/Icon'
import cx from 'classnames'
import { get, flowRight as compose } from 'lodash'
import Switch from 'components/Switch'
import Figure from 'cozy-ui/transpiled/react/Figure'
import {
  getAccountLabel,
  getAccountUpdatedAt,
  getAccountInstitutionLabel,
  getAccountBalance,
  isReimbursementsAccount
} from 'ducks/account/helpers'
import { getWarningLimitPerAccount } from 'selectors'
import styles from 'ducks/balance/components/AccountRow.styl'
import ReimbursementsIcon from 'ducks/balance/components/ReimbursementsIcon'
import AccountIcon from 'components/AccountIcon'
import { triggersConn } from 'doctypes'
import { isErrored } from 'utils/triggers'
import { Contact } from 'cozy-doctypes'

const UpdatedAt = React.memo(function UpdatedAt({ account, t }) {
  const updatedAt = getAccountUpdatedAt(account)
  return (
    <span className={updatedAt.params.nbDays > 1 ? 'u-warn' : null}>
      <Icon
        icon="sync"
        width="10"
        color="currentColor"
        className={styles.AccountRow__updatedAtIcon}
      />
      {t(updatedAt.translateKey, updatedAt.params)}
    </span>
  )
})

const FailedTriggerMessage = translate()(
  React.memo(function FailedTriggerMessage({ t }) {
    return <span className="u-error">{t('Balance.trigger-problem')}</span>
  })
)

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

const AccountRowSubText = ({ className, children, ...rest }) => {
  return (
    <div className={cx(styles.AccountRow__subText, className)} {...rest}>
      {children}
    </div>
  )
}

const DumbAccountCaption = props => {
  const { t } = useI18n()
  const { triggersCol, account, className, ...rest } = props

  if (isReimbursementsAccount(account)) {
    return (
      <AccountRowSubText className={className} {...rest}>
        {t('Balance.reimbursements-caption')}
      </AccountRowSubText>
    )
  }

  const triggers = triggersCol.data
  const failedTrigger = triggers.find(
    x =>
      isErrored(x.attributes) &&
      get(x, 'attributes.message.konnector') ===
        get(account, 'cozyMetadata.createdByApp')
  )

  return (
    <AccountRowSubText className={className} {...rest}>
      {failedTrigger && !flag('demo') && flag('balance-account-errors') ? (
        <FailedTriggerMessage trigger={failedTrigger} />
      ) : (
        <UpdatedAt account={account} t={t} />
      )}
    </AccountRowSubText>
  )
}

const AccountCaption = React.memo(DumbAccountCaption)

class AccountRow extends React.PureComponent {
  static propTypes = {
    account: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    breakpoints: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired,
    hasWarning: PropTypes.bool.isRequired,
    checked: PropTypes.bool.isRequired,
    disabled: PropTypes.bool.isRequired,
    onSwitchChange: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired
  }

  handleSwitchClick = e => {
    e.stopPropagation()
  }

  render() {
    const {
      account,
      onClick,
      breakpoints: { isMobile },
      t,
      hasWarning,
      checked,
      disabled,
      onSwitchChange,
      id,
      triggersCol
    } = this.props

    const owners = account.owners.data
      .filter(Boolean)
      .filter(owner => !owner.me)

    const shouldShowOwners = owners.length > 0

    const hasAlert = account.balance < 0
    const accountLabel = getAccountLabel(account)

    const showUpdatedAtOutside = isMobile && shouldShowOwners

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
                <Owners
                  className={styles.AccountRow__subText}
                  owners={owners}
                />
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
              onClick={this.handleSwitchClick}
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
  withBreakpoints(),
  translate(),
  React.memo,
  withClient
)(AccountRow)
