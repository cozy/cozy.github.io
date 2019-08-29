import React from 'react'
import PropTypes from 'prop-types'
import { withBreakpoints, translate } from 'cozy-ui/react'
import Icon from 'cozy-ui/react/Icon'
import cx from 'classnames'
import { flowRight as compose } from 'lodash'
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
      id
    } = this.props

    const updatedAt = getAccountUpdatedAt(account)
    const hasWarning = account.balance < warningLimit
    const hasAlert = account.balance < 0
    const accountLabel = getAccountLabel(account)
    const isHealthReimbursements = isHealthReimbursementsAccount(account)

    return (
      <li
        className={cx(styles.AccountRow, 'u-clickable', {
          [styles['AccountRow--hasWarning']]: hasWarning,
          [styles['AccountRow--hasAlert']]: hasAlert,
          [styles['AccountRow--disabled']]:
            (!checked || disabled) && account.loading !== true
        })}
        onClick={onClick}
      >
        <div className={styles.AccountRow__column}>
          <div className={styles.AccountRow__logo}>
            <AccountIcon account={account} />
            {isHealthReimbursements && <HealthReimbursementsIcon />}
          </div>
          <div className={styles.AccountRow__labelUpdatedAtWrapper}>
            <div className={styles.AccountRow__label}>
              {account.virtual ? t(accountLabel) : accountLabel}
            </div>
            <div
              className={cx(styles.AccountRow__updatedAt, {
                [styles['AccountRow__updatedAt--old']]:
                  updatedAt.params.nbDays > 1
              })}
            >
              <Icon
                icon="sync"
                width="10"
                color="currentColor"
                className={styles.AccountRow__updatedAtIcon}
              />
              {t(updatedAt.translateKey, updatedAt.params)}
            </div>
          </div>
        </div>
        {!isMobile && account.number && (
          <div
            className={cx(
              styles.AccountRow__column,
              styles['AccountRow__column--secondary']
            )}
          >
            N°
            {account.number}
          </div>
        )}
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
          <Switch
            disableRipple
            checked={checked}
            // Do not deactivate interactions with the button,
            // only color it to look disabled
            color={disabled ? 'default' : 'primary'}
            onClick={this.handleSwitchClick}
            id={id}
            onChange={onSwitchChange}
          />
        </div>
      </li>
    )
  }
}

export default compose(
  withBreakpoints(),
  translate()
)(AccountRow)
