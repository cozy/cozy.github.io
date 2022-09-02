import React, { useState } from 'react'

import TagAddChip from 'components/Tag/TagAddChip'
import TagAddModalOrBottomSheet from 'ducks/categories/CategoriesTags/TagAddModalOrBottomSheet'

const TagAdd = ({ tags, tagListSelected, onConfirm }) => {
  const [showModalOrBottomSheet, setShowModalOrBottomSheet] = useState(false)

  return (
    <>
      <TagAddChip
        onClick={() => setShowModalOrBottomSheet(true)}
        disabled={tags.length === 0}
      />
      {showModalOrBottomSheet && (
        <TagAddModalOrBottomSheet
          tags={tags}
          tagListSelected={tagListSelected}
          onConfirm={onConfirm}
          onClose={() => setShowModalOrBottomSheet(false)}
        />
      )}
    </>
  )
}

export default TagAdd
