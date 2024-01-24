import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import TagIcon from 'cozy-ui/transpiled/react/Icons/Tag'

import TagChipList from 'ducks/categories/CategoriesTags/TagChipList'
import TagAdd from 'ducks/categories/CategoriesTags/TagAdd'

const TagListItem = ({
  tags,
  tagListSelected,
  onDelete,
  onConfirm,
  ...props
}) => {
  return (
    <ListItem {...props}>
      <ListItemIcon>
        <Icon icon={TagIcon} />
      </ListItemIcon>
      <ListItemText
        ellipsis={false}
        primary={
          <>
            <TagChipList tags={tagListSelected} onDelete={onDelete} />
            <TagAdd
              tags={tags}
              tagListSelected={tagListSelected}
              onConfirm={onConfirm}
            />
          </>
        }
      />
    </ListItem>
  )
}

export default TagListItem
