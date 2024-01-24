import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'

import TagAddModalContentList from 'components/Tag/TagAddModalContentList'

const TagAddModalContent = ({
  toggleAddNewTagModal,
  selectedTagIds,
  tags,
  onClick,
  isSaving
}) => {
  const { t } = useI18n()

  if (tags.length === 0 && toggleAddNewTagModal) {
    return (
      <List>
        <ListItem button onClick={toggleAddNewTagModal} disabled={isSaving}>
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
      isSaving={isSaving}
    />
  )
}

export default TagAddModalContent
