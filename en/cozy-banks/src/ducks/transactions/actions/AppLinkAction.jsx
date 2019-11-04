import React from 'react'
import { capitalize, findKey, omit } from 'lodash'
import { translate } from 'cozy-ui/react'
import ButtonAction from 'cozy-ui/react/ButtonAction'
import Chip from 'cozy-ui/react/Chip'
import Icon from 'cozy-ui/react/Icon'
import flag from 'cozy-flags'
import icon from 'assets/icons/actions/icon-link-out.svg'
import styles from 'ducks/transactions/TransactionActions.styl'
import { TransactionModalRow } from 'ducks/transactions/TransactionModal'
import palette from 'cozy-ui/react/palette'

const name = 'app'

const getAppName = (urls, transaction) => {
  const filteredUrls = omit(urls, ['COLLECT', 'HOME'])

  const label = transaction.label.toLowerCase()
  return findKey(
    filteredUrls,
    (url, appName) => url && label.indexOf(appName.toLowerCase()) !== -1
  )
}

const beautify = appName => {
  return appName.toLowerCase() === 'edf' ? 'EDF' : capitalize(appName)
}

const transactionModalRowStyle = { color: palette.dodgerBlue }
const Component = ({
  t,
  transaction,
  actionProps: { urls },
  compact,
  isModalItem
}) => {
  const appName = getAppName(urls, transaction)
  const label = t(`Transactions.actions.${name}`, {
    appName: beautify(appName)
  })
  const url = urls[appName]

  if (isModalItem) {
    return (
      <TransactionModalRow
        onClick={() => open(url)}
        iconLeft="openwith"
        style={transactionModalRowStyle}
      >
        {label}
      </TransactionModalRow>
    )
  }

  return flag('reimbursements.tag') ? (
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
  match: (transaction, { urls }) => {
    return getAppName(urls, transaction)
  },
  Component: translate()(Component)
}

export default action
