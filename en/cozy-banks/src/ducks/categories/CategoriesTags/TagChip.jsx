import React from 'react'

import Chip from 'cozy-ui/transpiled/react/Chips'

const TagChip = ({ tag, className, onDelete, onClick }) => {
  return (
    <Chip
      style={{ marginBottom: '0.25rem', marginRight: '0.25rem' }}
      className={className}
      label={tag.label}
      clickable
      onDelete={() => onDelete(tag)}
      onClick={onClick}
    />
  )
}

export default TagChip
