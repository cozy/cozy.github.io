import React from 'react'
import { useI18n } from 'cozy-ui/transpiled/react'
import Chip from 'cozy-ui/transpiled/react/Chip'
import Icon from 'cozy-ui/transpiled/react/Icon'
import icon from 'assets/icons/actions/icon-link-out.svg'
import { isHealth } from 'ducks/categories/helpers'
import palette from 'cozy-ui/transpiled/react/palette'
import TransactionModalRow from 'ducks/transactions/TransactionModalRow'

const name = 'refund'

const transactionModalRowStyle = { color: palette.dodgerBlue }
const Component = ({ actionProps: { urls }, isModalItem }) => {
  const { t } = useI18n()
  const url = `${urls['HEALTH']}#/remboursements`
  const label = t(`Transactions.actions.${name}`)

  if (isModalItem) {
    return (
      <TransactionModalRow
        onClick={() => open(url, '_blank')}
        iconLeft="openwith"
        style={transactionModalRowStyle}
      >
        {label}
      </TransactionModalRow>
    )
  }

  return (
    <Chip size="small" variant="outlined" onClick={() => open(url)}>
      {label}
      <Chip.Separator />
      <Icon icon="openwith" />
    </Chip>
  )
}

const action = {
  name,
  icon,
  color: palette.dodgerBlue,
  match: (transaction, { urls }) => {
    return isHealth(transaction) && urls && urls['HEALTH']
  },
  Component: Component
}

export default action
