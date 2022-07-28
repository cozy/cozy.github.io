import React, { useState } from 'react'

import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import TagAddModal from 'components/Tag/TagAddModal'
import TagBottomSheet from 'components/Tag/TagBottomSheet'

const isAlreadyChecked = (selectedTagIds, tag) =>
  selectedTagIds.some(tagId => tagId === tag._id)

const TagAddModalOrBottomSheet = ({ tags, tagListSelected, onClose }) => {
  const { isMobile } = useBreakpoints()
  const [selectedTagIds, setSelectedTagIds] = useState(
    tagListSelected.map(tagSelected => tagSelected._id)
  )

  const handleClick = tag => {
    if (isAlreadyChecked(selectedTagIds, tag)) {
      setSelectedTagIds(prev => prev.filter(id => id !== tag._id))
    } else if (selectedTagIds.length < 5) {
      setSelectedTagIds(prev => [...prev, tag._id])
    }
  }

  const handleClose = () => {
    const selectedTagList = tags.filter(tag =>
      selectedTagIds.some(selectedTagId => selectedTagId === tag._id)
    )
    onClose(selectedTagList)
  }

  const ModalOrBottomSheet = isMobile ? TagBottomSheet : TagAddModal

  return (
    <ModalOrBottomSheet
      tags={tags}
      selectedTagIds={selectedTagIds}
      onClick={handleClick}
      onClose={handleClose}
      withButton
    />
  )
}

export default TagAddModalOrBottomSheet
