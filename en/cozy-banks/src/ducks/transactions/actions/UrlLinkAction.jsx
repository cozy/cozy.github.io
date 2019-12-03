import React from 'react'
import icon from 'assets/icons/actions/icon-link-out.svg'
import ButtonAction from 'cozy-ui/react/ButtonAction'
import Chip from 'cozy-ui/react/Chip'
import Icon from 'cozy-ui/react/Icon'
import flag from 'cozy-flags'
import styles from 'ducks/transactions/TransactionActions.styl'
import TransactionModalRow from 'ducks/transactions/TransactionModalRow'
import palette from 'cozy-ui/react/palette'

const name = 'url'

const transactionModalRowStyle = { color: palette.dodgerBlue }
const Component = ({ transaction, compact, isModalItem }) => {
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

  return flag('reimbursements.tag') ? (
    <Chip
      size="small"
      variant="outlined"
      onClick={() => open(action.url, action.target)}
    >
      {action.trad}
      <Chip.Separator />
      <Icon icon="openwith" />
    </Chip>
  ) : (
    <ButtonAction
      onClick={() => open(action.url, action.target)}
      label={action.trad}
      rightIcon="openwith"
      compact={compact}
      className={styles.TransactionActionButton}
    />
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
