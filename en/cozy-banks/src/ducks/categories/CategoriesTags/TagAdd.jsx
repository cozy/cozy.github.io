import React, { useState } from 'react'

import TagAddChip from 'components/Tag/TagAddChip'
import TagAddModalOrBottomSheet from 'ducks/categories/CategoriesTags/TagAddModalOrBottomSheet'

const TagAdd = ({ tags, tagListSelected, onConfirm }) => {
  const [showModalOrBottomSheet, setShowModalOrBottomSheet] = useState(false)

  const handleClose = selectedTagIds => {
    onConfirm(selectedTagIds)
    setShowModalOrBottomSheet(false)
  }

  return (
    <>
      <TagAddChip onClick={() => setShowModalOrBottomSheet(true)} />
      {showModalOrBottomSheet && (
        <TagAddModalOrBottomSheet
          tags={tags}
          tagListSelected={tagListSelected}
          onClose={handleClose}
        />
      )}
    </>
  )
}

export default TagAdd
