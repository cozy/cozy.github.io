import React from 'react'
import { translate } from 'cozy-ui/react'
import icon from 'assets/icons/actions/icon-link.svg'
import { TransactionModalRow } from 'ducks/transactions/TransactionModal'

const name = 'attach'

const Component = ({ t }) => {
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
  Component: translate()(Component)
}

export default action
