import React, { useState, useEffect } from 'react'

import { useQueryAll, isQueryLoading } from 'cozy-client'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import { tagsConn } from 'doctypes'
import TagAddModal from 'components/Tag/TagAddModal'
import TagBottomSheet from 'components/Tag/TagBottomSheet'
import TagAddNewTagModal from 'components/Tag/TagAddNewTagModal'
import {
  addTag,
  removeTag,
  getTransactionTags,
  getTransactionTagsIds
} from 'ducks/transactions/helpers'
import { makeTagsToRemove, makeTagsToAdd } from 'components/Tag/helpers'

const TagAddModalOrBottomSheet = ({ transaction, onClose }) => {
  const { isMobile } = useBreakpoints()
  const [showAddNewTagModal, setShowAddNewTagModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState(() =>
    getTransactionTagsIds(transaction)
  )
  const [hasTagsBeenModified, setHasTagsBeenModified] = useState(false)

  const toggleAddNewTagModal = () => setShowAddNewTagModal(prev => !prev)

  const { data: tags, ...tagsQueryRest } = useQueryAll(tagsConn.query, tagsConn)
  const isLoading = isQueryLoading(tagsQueryRest) || tagsQueryRest.hasMore

  useEffect(() => {
    setSelectedTagIds(getTransactionTagsIds(transaction))
  }, [transaction])

  const handleClick = tag => {
    if (selectedTagIds.some(tagId => tagId === tag._id)) {
      setSelectedTagIds(prev => prev.filter(id => id !== tag._id))
    } else if (selectedTagIds.length < 5) {
      setSelectedTagIds(prev => [...prev, tag._id])
    }
    setHasTagsBeenModified(true)
  }

  const handleClose = () => {
    if (hasTagsBeenModified) {
      setIsSaving(true)
    } else {
      onClose()
    }
  }

  useEffect(() => {
    if (isSaving) {
      const tagsToRemove = makeTagsToRemove({
        transactionTags: getTransactionTags(transaction),
        selectedTagIds,
        allTags: tags
      })
      const tagsToAdd = makeTagsToAdd({
        transactionTags: getTransactionTags(transaction),
        selectedTagIds,
        allTags: tags
      })

      if (tagsToRemove.length > 0) {
        removeTag(transaction, tagsToRemove)
      }
      if (tagsToAdd.length > 0) {
        addTag(transaction, tagsToAdd)
      }

      onClose()
    }
  }, [isSaving, transaction, selectedTagIds, tags, onClose])

  const ModalOrBottomSheet = isMobile ? TagBottomSheet : TagAddModal

  return (
    <>
      <ModalOrBottomSheet
        tags={tags}
        selectedTagIds={selectedTagIds}
        isSaving={isSaving}
        isLoading={isLoading}
        toggleAddNewTagModal={toggleAddNewTagModal}
        onClick={handleClick}
        onClose={handleClose}
      />
      {showAddNewTagModal && (
        <TagAddNewTagModal
          transaction={transaction}
          onClose={toggleAddNewTagModal}
        />
      )}
    </>
  )
}

export default TagAddModalOrBottomSheet
