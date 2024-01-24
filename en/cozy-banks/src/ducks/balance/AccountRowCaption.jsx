import React, { useMemo } from 'react'
import get from 'lodash/get'

import Icon from 'cozy-ui/transpiled/react/Icon'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'
import SyncIcon from 'cozy-ui/transpiled/react/Icons/Sync'

import flag from 'cozy-flags'
import { models } from 'cozy-client'
import {
  getAccountUpdatedAt,
  isReimbursementsAccount
} from 'ducks/account/helpers'
import styles from 'ducks/balance/AccountRow.styl'

const { trigger: triggerLibs } = models

const { isErrored } = triggerLibs.triggerStates

const UpdatedAt = React.memo(function UpdatedAt({ account, trigger }) {
  const { t } = useI18n()
  const updatedAt = getAccountUpdatedAt(account, trigger)
  return (
    <span className={updatedAt.params.nbDays > 1 ? 'u-warning' : null}>
      <Icon
        icon={SyncIcon}
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

const getAccountIdFromBankAccount = bankAccount => {
  return get(bankAccount, 'relationships.connection.data._id')
}
const DumbAccountCaption = props => {
  const { t } = useI18n()
  const { account, className, triggers, ...rest } = props

  const trigger = useMemo(
    () =>
      triggers &&
      triggers.find(trigger => {
        const triggerAccountId = triggerLibs.triggers.getAccountId(
          trigger.attributes
        )
        const accountId = getAccountIdFromBankAccount(account)
        return triggerAccountId === accountId
      }),
    [triggers, account]
  )

  const isTriggerFailed = trigger && isErrored(trigger.attributes)

  if (isReimbursementsAccount(account)) {
    return (
      <Typography
        variant="caption"
        color="textSecondary"
        className={className}
        {...rest}
      >
        {t('Balance.reimbursements-caption')}
      </Typography>
    )
  }

  return (
    <Typography
      variant="caption"
      color="textSecondary"
      className={className}
      {...rest}
    >
      {isTriggerFailed && !flag('demo') && flag('balance-account-errors') ? (
        <FailedTriggerMessage trigger={trigger} />
      ) : (
        <UpdatedAt account={account} trigger={trigger} />
      )}
    </Typography>
  )
}

const AccountCaption = React.memo(DumbAccountCaption)

export default AccountCaption
