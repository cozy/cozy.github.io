import React from 'react'
import { useI18n } from 'cozy-ui/transpiled/react'
import icon from 'assets/icons/actions/icon-link.svg'
import TransactionModalRow from 'ducks/transactions/TransactionModalRow'

const name = 'attach'

const Component = () => {
  const { t } = useI18n()
  return (
    <TransactionModalRow iconLeft={icon} disabled>
      {t('Transactions.actions.attach')}
    </TransactionModalRow>
  )
}

const action = {
  name,
  icon,
  disabled: true,
  match: () => false,
  Component: Component
}

export default action
