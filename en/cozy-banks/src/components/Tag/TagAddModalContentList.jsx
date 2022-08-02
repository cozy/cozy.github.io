import React, { Fragment } from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Divider from 'cozy-ui/transpiled/react/MuiCozyTheme/Divider'

import TagAddModalContentListItem from 'components/Tag/TagAddModalContentListItem'

const TagAddModalContentList = ({
  tags,
  toggleAddNewTagModal,
  selectedTagIds,
  onClick
}) => {
  const { t } = useI18n()

  return (
    <>
      <List>
        {tags.map((tag, index) => (
          <Fragment key={`${tag.label} ${index}`}>
            <TagAddModalContentListItem
              tag={tag}
              checked={selectedTagIds.some(id => id === tag._id)}
              onClick={onClick}
            />
            <Divider component="li" variant="inset" />
          </Fragment>
        ))}
        {toggleAddNewTagModal && (
          <ListItem button onClick={toggleAddNewTagModal}>
            <ListItemIcon>
              <Icon icon={PlusIcon} />
            </ListItemIcon>
            <ListItemText primary={t('Tag.new-tag')} />
          </ListItem>
        )}
        <Divider component="li" />
      </List>
    </>
  )
}

export default TagAddModalContentList
