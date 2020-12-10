import React from 'react'
import get from 'lodash/get'

import Icon from 'cozy-ui/transpiled/react/Icon'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
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

const UpdatedAt = React.memo(function UpdatedAt({ account }) {
  const { t } = useI18n()
  const updatedAt = getAccountUpdatedAt(account)
  return (
    <span className={updatedAt.params.nbDays > 1 ? 'u-warn' : null}>
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

const DumbAccountCaption = props => {
  const { t } = useI18n()
  const { triggersCol, account, className, ...rest } = props

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

  const triggers = triggersCol.data
  const failedTrigger = triggers.find(
    x =>
      isErrored(x.attributes) &&
      get(x, 'attributes.message.konnector') ===
        get(account, 'cozyMetadata.createdByApp')
  )

  return (
    <Typography
      variant="caption"
      color="textSecondary"
      className={className}
      {...rest}
    >
      {failedTrigger && !flag('demo') && flag('balance-account-errors') ? (
        <FailedTriggerMessage trigger={failedTrigger} />
      ) : (
        <UpdatedAt account={account} />
      )}
    </Typography>
  )
}

const AccountCaption = React.memo(DumbAccountCaption)

export default AccountCaption
