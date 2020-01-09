import React from 'react'
import PropTypes from 'prop-types'
import CozyClient, { queryConnect, withClient } from 'cozy-client'
import { withBreakpoints, translate } from 'cozy-ui/transpiled/react'
import flag from 'cozy-flags'
import Icon from 'cozy-ui/transpiled/react/Icon'
import cx from 'classnames'
import { get, flowRight as compose, keyBy, omit } from 'lodash'
import Switch from 'components/Switch'
import { Figure } from 'components/Figure'
import {
  getAccountLabel,
  getAccountUpdatedAt,
  getAccountInstitutionLabel,
  getAccountBalance,
  isHealthReimbursementsAccount
} from 'ducks/account/helpers'
import styles from 'ducks/balance/components/AccountRow.styl'
import { HealthReimbursementsIcon } from 'ducks/balance/components/HealthReimbursementsIcon'
import AccountIcon from 'components/AccountIcon'
import { triggersConn, CONTACT_DOCTYPE } from 'doctypes'
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

const DumbUpdatedAtOrFail = props => {
  const { triggersCol, account, t, className, ...rest } = omit(props, 'f')
  const triggers = triggersCol.data

  const failedTrigger = triggers.find(
    x =>
      isErrored(x.attributes) &&
      get(x, 'attributes.message.konnector') ===
        get(account, 'cozyMetadata.createdByApp')
  )

  return (
    <div className={cx(styles.AccountRow__subText, className)} {...rest}>
      {failedTrigger && !flag('demo') && flag('balance-account-errors') ? (
        <FailedTriggerMessage trigger={failedTrigger} />
      ) : (
        <UpdatedAt account={account} t={t} />
      )}
    </div>
  )
}

const UpdatedAtOrFail = compose(
  translate(),
  React.memo
)(DumbUpdatedAtOrFail)

class AccountRow extends React.PureComponent {
  static propTypes = {
    account: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    breakpoints: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired,
    warningLimit: PropTypes.number.isRequired,
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
      warningLimit,
      checked,
      disabled,
      onSwitchChange,
      id,
      triggersCol,
      client
    } = this.props

    // TODO Extract it to a selector
    const contacts = client.getCollectionFromState(CONTACT_DOCTYPE)
    const contactsById = keyBy(contacts, contact => contact._id)
    const ownerRelationships = get(account, 'relationships.owners.data', [])

    const owners = ownerRelationships
      .map(data => contactsById[data._id])
      .filter(owner => !owner.me)

    const shouldShowOwners = owners.length > 0

    const hasWarning = account.balance < warningLimit
    const hasAlert = account.balance < 0
    const isHealthReimbursements = isHealthReimbursementsAccount(account)
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
              <AccountIcon account={account} />
              {isHealthReimbursements && <HealthReimbursementsIcon />}
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
                <UpdatedAtOrFail triggersCol={triggersCol} account={account} />
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
            <UpdatedAtOrFail triggersCol={triggersCol} account={account} />
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
  withBreakpoints(),
  translate(),
  React.memo,
  withClient
)(AccountRow)
