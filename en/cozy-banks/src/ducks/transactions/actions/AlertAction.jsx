import React from 'react'
import { translate } from 'cozy-ui/react'
import icon from 'assets/icons/actions/icon-bell-16.svg'
import TransactionModalRow from 'ducks/transactions/TransactionModalRow'

const name = 'alert'

const Component = ({ t }) => {
  return (
    <TransactionModalRow iconLeft={icon} disabled>
      {t('Transactions.actions.alert')}
    </TransactionModalRow>
  )
}

const action = {
  name,
  icon,
  disabled: true,
  match: () => false,
  Component: translate()(Component)
}

export default action
