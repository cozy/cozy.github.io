import React from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import List from 'cozy-ui/transpiled/react/List'
import { useSelector } from 'react-redux'
import { getAccountsById } from 'selectors'
import { DialogSection, DialogListItem } from 'components/DialogSections'
import AccountOrGroupLabel from 'ducks/settings/CategoryAlerts/AccountOrGroupLabel'
import AccountIcon from 'components/AccountIcon'
import { ACCOUNT_DOCTYPE } from 'doctypes'

const AccountOrGroupSection = ({ label, value, onClick, chooserProps }) => {
  const { t } = useI18n()
  const accountsById = useSelector(getAccountsById)

  return (
    <DialogSection label={label}>
      <List>
        <DialogListItem
          icon={
            value &&
            value._type === ACCOUNT_DOCTYPE &&
            accountsById[value._id] ? (
              <AccountIcon key={value._id} account={accountsById[value._id]} />
            ) : null
          }
          label={
            value ? (
              <AccountOrGroupLabel doc={value} />
            ) : chooserProps && !chooserProps.canSelectAll ? (
              <i>{t('AccountGroupChoice.nothing-selected')}</i>
            ) : (
              t('AccountGroupChoice.all-accounts')
            )
          }
          onClick={onClick}
          hasArrow={true}
        />
      </List>
    </DialogSection>
  )
}

export default AccountOrGroupSection
