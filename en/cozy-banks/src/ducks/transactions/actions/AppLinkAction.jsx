import React, { useCallback } from 'react'
import omit from 'lodash/omit'
import findKey from 'lodash/findKey'
import capitalize from 'lodash/capitalize'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Chip from 'cozy-ui/transpiled/react/deprecated/Chip'
import Icon from 'cozy-ui/transpiled/react/Icon'
import icon from 'assets/icons/actions/icon-link-out.svg'
import palette from 'cozy-ui/transpiled/react/palette'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import OpenwithIcon from 'cozy-ui/transpiled/react/Icons/Openwith'

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

const transactionDialogListItemStyle = { color: palette.dodgerBlue }
const Component = ({ transaction, actionProps: { urls }, isModalItem }) => {
  const { t } = useI18n()
  const appName = getAppName(urls, transaction)
  const label = t(`Transactions.actions.${name}`, {
    appName: beautify(appName)
  })
  const url = urls[appName]

  const handleClick = useCallback(
    evt => {
      evt?.stopPropagation()
      evt?.preventDefault()
      open(url)
    },
    [url]
  )

  if (isModalItem) {
    return (
      <ListItem
        button
        divider
        onClick={handleClick}
        style={transactionDialogListItemStyle}
      >
        <ListItemIcon>
          <Icon icon={OpenwithIcon} />
        </ListItemIcon>
        <ListItemText>{label}</ListItemText>
      </ListItem>
    )
  }

  return (
    <Chip size="small" variant="outlined" onClick={handleClick}>
      {label}
      <Chip.Separator />
      <Icon icon={OpenwithIcon} />
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
