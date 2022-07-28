import React from 'react'

import TagChip from 'ducks/categories/CategoriesTags/TagChip'

const TagChips = ({ tags, onDelete, className }) => {
  return tags.map(tag => (
    <TagChip
      key={tag._id}
      tag={tag}
      className={className}
      onDelete={onDelete}
    />
  ))
}

export default TagChips
