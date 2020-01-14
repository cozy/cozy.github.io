import React from 'react'
import { capitalize, findKey, omit } from 'lodash'
import { useI18n } from 'cozy-ui/transpiled/react'
import Chip from 'cozy-ui/transpiled/react/Chip'
import Icon from 'cozy-ui/transpiled/react/Icon'
import icon from 'assets/icons/actions/icon-link-out.svg'
import TransactionModalRow from 'ducks/transactions/TransactionModalRow'
import palette from 'cozy-ui/transpiled/react/palette'

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
const Component = ({ transaction, actionProps: { urls }, isModalItem }) => {
  const { t } = useI18n()
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
  match: (transaction, { urls }) => {
    return getAppName(urls, transaction)
  },
  Component: Component
}

export default action
