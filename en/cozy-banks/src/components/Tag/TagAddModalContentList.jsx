import React, { Fragment } from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Divider from 'cozy-ui/transpiled/react/Divider'

import TagAddModalContentListItem from 'components/Tag/TagAddModalContentListItem'

const TagAddModalContentList = ({
  tags,
  toggleAddNewTagModal,
  selectedTagIds,
  onClick,
  isSaving
}) => {
  const { t } = useI18n()

  return (
    <List>
      {tags.map((tag, index) => (
        <Fragment key={`${tag.label} ${index}`}>
          <TagAddModalContentListItem
            tag={tag}
            checked={selectedTagIds.some(id => id === tag._id)}
            onClick={onClick}
            disabled={toggleAddNewTagModal && selectedTagIds.length >= 5}
            isSaving={isSaving}
          />
          <Divider component="li" variant="inset" />
        </Fragment>
      ))}
      {toggleAddNewTagModal && (
        <ListItem button onClick={toggleAddNewTagModal} disabled={isSaving}>
          <ListItemIcon>
            <Icon icon={PlusIcon} />
          </ListItemIcon>
          <ListItemText primary={t('Tag.add-new-tag')} />
        </ListItem>
      )}
    </List>
  )
}

export default TagAddModalContentList
