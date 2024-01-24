import React, { useState, useEffect } from 'react'

import { useQueryAll, isQueryLoading, useClient } from 'cozy-client'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { tagsConn } from 'doctypes'
import TagAddModal from 'components/Tag/TagAddModal'
import TagBottomSheet from 'components/Tag/TagBottomSheet'
import TagAddNewTagModal from 'components/Tag/TagAddNewTagModal'
import {
  getTagsRelationshipByTransaction,
  getTransactionTagsIds,
  updateTagRelationshipFromTransaction
} from 'ducks/transactions/helpers'
import { makeTagsToRemove, makeTagsToAdd } from 'components/Tag/helpers'
import { trackPage, useTrackPage } from 'ducks/tracking/browser'

const TagAddModalOrBottomSheet = ({ transaction, onClose }) => {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const client = useClient()
  const [showAddNewTagModal, setShowAddNewTagModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState(() =>
    getTransactionTagsIds(transaction)
  )
  const [hasTagsBeenModified, setHasTagsBeenModified] = useState(false)

  useTrackPage('mon_compte:depense:ajout-label-saisie')

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

  const handleConfirm = async () => {
    trackPage('mon_compte:depense:ajout-label-confirmation')
    if (hasTagsBeenModified) {
      setIsSaving(true)
      const tagsToRemove = makeTagsToRemove({
        transactionTags: getTagsRelationshipByTransaction(transaction),
        selectedTagIds,
        allTags: tags
      })
      const tagsToAdd = makeTagsToAdd({
        transactionTags: getTagsRelationshipByTransaction(transaction),
        selectedTagIds,
        allTags: tags
      })

      await updateTagRelationshipFromTransaction({
        client,
        transaction,
        tagsToRemove,
        tagsToAdd
      })

      onClose()
    } else onClose()
  }

  const ModalOrBottomSheet = isMobile ? TagBottomSheet : TagAddModal

  return (
    <>
      <ModalOrBottomSheet
        tags={tags}
        title={t('Tag.add-tag')}
        selectedTagIds={selectedTagIds}
        isSaving={isSaving}
        isLoading={isLoading}
        toggleAddNewTagModal={toggleAddNewTagModal}
        onClick={handleClick}
        onClose={onClose}
        onConfirm={handleConfirm}
      />
      {showAddNewTagModal && (
        <TagAddNewTagModal
          onClose={toggleAddNewTagModal}
          onClick={handleClick}
        />
      )}
    </>
  )
}

export default TagAddModalOrBottomSheet
