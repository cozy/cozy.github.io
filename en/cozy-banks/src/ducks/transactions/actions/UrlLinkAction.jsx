import React, { useCallback } from 'react'
import icon from 'assets/icons/actions/icon-link-out.svg'
import Chip from 'cozy-ui/transpiled/react/deprecated/Chip'
import Icon from 'cozy-ui/transpiled/react/Icon'

import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import palette from 'cozy-ui/transpiled/react/palette'

import OpenwithIcon from 'cozy-ui/transpiled/react/Icons/Openwith'

const name = 'url'

const transactionDialogListItemStyle = { color: palette.dodgerBlue }
const Component = ({ transaction, isModalItem }) => {
  const action = transaction.action

  const handleClick = useCallback(
    evt => {
      evt?.stopPropagation()
      evt?.preventDefault()
      open(action.url, action.target)
    },
    [action.target, action.url]
  )

  if (isModalItem) {
    return (
      <ListItem
        divider
        button
        onClick={handleClick}
        style={transactionDialogListItemStyle}
      >
        <ListItemIcon>
          <Icon icon={OpenwithIcon} />
        </ListItemIcon>
        <ListItemText>{action.trad}</ListItemText>
      </ListItem>
    )
  }

  return (
    <Chip size="small" variant="outlined" onClick={handleClick}>
      {action.trad}
      <Chip.Separator />
      <Icon icon={OpenwithIcon} />
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
