import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'

import TagAddModalContentList from 'components/Tag/TagAddModalContentList'

const TagAddModalContent = ({
  toggleAddNewTagModal,
  selectedTagIds,
  tags,
  onClick
}) => {
  const { t } = useI18n()

  if (tags.length === 0) {
    return (
      <List>
        <ListItem onClick={toggleAddNewTagModal}>
          <ListItemIcon>
            <Icon icon={PlusIcon} />
          </ListItemIcon>
          <ListItemText>{t('Tag.add-new-tag')}</ListItemText>
        </ListItem>
      </List>
    )
  }

  return (
    <TagAddModalContentList
      tags={tags}
      toggleAddNewTagModal={toggleAddNewTagModal}
      selectedTagIds={selectedTagIds}
      onClick={onClick}
    />
  )
}

export default TagAddModalContent
