import React from 'react'
import cx from 'classnames'
import get from 'lodash/get'

import Icon from 'cozy-ui/transpiled/react/Icon'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

import flag from 'cozy-flags'
import { isErrored } from 'utils/triggers'
import {
  getAccountUpdatedAt,
  isReimbursementsAccount
} from 'ducks/account/helpers'
import styles from 'ducks/balance/AccountRow.styl'

export const AccountRowSubText = ({ className, children, ...rest }) => {
  return (
    <div className={cx(styles.AccountRow__subText, className)} {...rest}>
      {children}
    </div>
  )
}

const UpdatedAt = React.memo(function UpdatedAt({ account }) {
  const { t } = useI18n()
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

const FailedTriggerMessage = React.memo(function FailedTriggerMessage() {
  const t = useI18n()
  return <span className="u-error">{t('Balance.trigger-problem')}</span>
})

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
        <UpdatedAt account={account} />
      )}
    </AccountRowSubText>
  )
}

const AccountCaption = React.memo(DumbAccountCaption)

export default AccountCaption
