import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import TagIcon from 'cozy-ui/transpiled/react/Icons/Tag'
import Chip from 'cozy-ui/transpiled/react/Chips'

const TagChip = ({ tag, className, onDelete, onClick }) => {
  return (
    <Chip
      style={{ marginBottom: '0.25rem', marginRight: '0.25rem' }}
      className={className}
      icon={<Icon className="u-ml-half" icon={TagIcon} />}
      label={tag.label}
      clickable
      onDelete={() => onDelete(tag)}
      onClick={onClick}
    />
  )
}

export default TagChip
