import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import { countTransactions } from 'components/Tag/helpers'

const TagAddModalContentListItem = ({
  tag,
  checked,
  onClick,
  disabled,
  isSaving
}) => {
  const { t } = useI18n()

  return (
    <ListItem
      button
      onClick={() => onClick(tag)}
      disabled={(!checked && disabled) || isSaving}
    >
      <ListItemIcon>
        <Checkbox checked={checked} />
      </ListItemIcon>
      <ListItemText
        primary={tag.label}
        secondary={t('Tag.transactions', {
          smart_count: countTransactions(tag)
        })}
      />
    </ListItem>
  )
}

export default React.memo(TagAddModalContentListItem)
