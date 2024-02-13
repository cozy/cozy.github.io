import React, { useCallback } from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Chip from 'cozy-ui/transpiled/react/deprecated/Chip'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import icon from 'assets/icons/actions/icon-link-out.svg'
import { isHealth } from 'ducks/categories/helpers'
import palette from 'cozy-ui/transpiled/react/palette'

import OpenwithIcon from 'cozy-ui/transpiled/react/Icons/Openwith'

const name = 'refund'

const transactionDialogListItemStyle = { color: palette.dodgerBlue }
const Component = ({ actionProps: { urls }, isModalItem }) => {
  const { t } = useI18n()
  const url = `${urls['HEALTH']}#/remboursements`
  const label = t(`Transactions.actions.${name}`)

  const handleClick = useCallback(
    evt => {
      evt?.stopPropagation()
      evt?.preventDefault()
      open(url)
    },
    [url]
  )

  const handleModalClick = useCallback(
    ev => {
      ev & ev.preventDefault()
      open(url, '_blank')
    },
    [url]
  )

  if (isModalItem) {
    return (
      <ListItem
        divider
        button
        onClick={handleModalClick}
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
  color: palette.dodgerBlue,
  match: (transaction, { urls }) => {
    return isHealth(transaction) && urls && urls['HEALTH']
  },
  Component: Component
}

export default action
