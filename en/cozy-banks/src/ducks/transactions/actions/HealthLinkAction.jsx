import React from 'react'
import { translate } from 'cozy-ui/react'
import ButtonAction from 'cozy-ui/react/ButtonAction'
import Chip from 'cozy-ui/react/Chip'
import Icon from 'cozy-ui/react/Icon'
import flag from 'cozy-flags'
import icon from 'assets/icons/actions/icon-link-out.svg'
import { isHealth } from 'ducks/categories/helpers'
import palette from 'cozy-ui/react/palette'
import styles from 'ducks/transactions/TransactionActions.styl'
import { TransactionModalRow } from 'ducks/transactions/TransactionModal'

const name = 'refund'

const transactionModalRowStyle = { color: palette.dodgerBlue }
const Component = ({ t, actionProps: { urls }, compact, isModalItem }) => {
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

  return flag('reimbursement-tag') ? (
    <Chip size="small" variant="outlined" onClick={() => open(url)}>
      {label}
      <Chip.Separator />
      <Icon icon="openwith" />
    </Chip>
  ) : (
    <ButtonAction
      onClick={() => open(url)}
      label={label}
      rightIcon="openwith"
      compact={compact}
      className={styles.TransactionActionButton}
    />
  )
}

const action = {
  name,
  icon,
  color: palette.dodgerBlue,
  match: (transaction, { urls }) => {
    return isHealth(transaction) && urls['HEALTH']
  },
  Component: translate()(Component)
}

export default action
