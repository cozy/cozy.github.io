import React from 'react'
import { useI18n } from 'cozy-ui/transpiled/react'
import { useSelector } from 'react-redux'
import { getAccountsById } from 'selectors'
import { ModalSection, ModalRow } from 'components/ModalSections'
import AccountOrGroupLabel from 'ducks/settings/CategoryAlerts/AccountOrGroupLabel'
import AccountIcon from 'components/AccountIcon'
import { ACCOUNT_DOCTYPE } from 'doctypes'

const AccountOrGroupSection = ({ label, value, onClick, chooserProps }) => {
  const { t } = useI18n()
  const accountsById = useSelector(getAccountsById)

  return (
    <ModalSection label={label}>
      <ModalRow
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
    </ModalSection>
  )
}

export default AccountOrGroupSection
