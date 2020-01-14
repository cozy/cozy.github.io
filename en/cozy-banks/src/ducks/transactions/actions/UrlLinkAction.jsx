import React from 'react'
import icon from 'assets/icons/actions/icon-link-out.svg'
import Chip from 'cozy-ui/transpiled/react/Chip'
import Icon from 'cozy-ui/transpiled/react/Icon'
import TransactionModalRow from 'ducks/transactions/TransactionModalRow'
import palette from 'cozy-ui/transpiled/react/palette'

const name = 'url'

const transactionModalRowStyle = { color: palette.dodgerBlue }
const Component = ({ transaction, isModalItem }) => {
  const action = transaction.action

  if (isModalItem) {
    return (
      <TransactionModalRow
        onClick={() => open(action.url, action.target)}
        iconLeft="openwith"
        style={transactionModalRowStyle}
      >
        {action.trad}
      </TransactionModalRow>
    )
  }

  return (
    <Chip
      size="small"
      variant="outlined"
      onClick={() => open(action.url, action.target)}
    >
      {action.trad}
      <Chip.Separator />
      <Icon icon="openwith" />
    </Chip>
  )
}

const action = {
  name,
  icon,
  match: transaction => {
    return (
      transaction.action &&
      transaction.action.type &&
      transaction.action.type === name
    )
  },
  Component
}

export default action
