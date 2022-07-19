import React, { useState, useEffect } from 'react'

import { useQueryAll, isQueryLoading } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'

import { tagsConn } from 'doctypes'
import TagAddModalContent from 'components/Tag/TagAddModalContent'
import TagAddNewTagModal from 'components/Tag/TagAddNewTagModal'
import {
  addTag,
  removeTag,
  getTransactionTags,
  getTransactionTagsIds
} from 'ducks/transactions/helpers'
import { makeTagsToRemove, makeTagsToAdd } from 'components/Tag/helpers'

const TagAddModal = ({ transaction, onClose }) => {
  const [showAddNewTagModal, setShowAddNewTagModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState(() =>
    getTransactionTagsIds(transaction)
  )
  const [hasTagsBeenModified, setHasTagsBeenModified] = useState(false)
  const { t } = useI18n()

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

  return (
    <>
      <ConfirmDialog
        size="small"
        open
        disableGutters
        title={<div className="u-mt-1-half">{t('Tag.add-tag')}</div>}
        content={
          isSaving || isLoading ? (
            <Spinner
              size="xlarge"
              className="u-flex u-flex-justify-center u-mv-1"
            />
          ) : (
            <TagAddModalContent
              toggleAddNewTagModal={toggleAddNewTagModal}
              selectedTagIds={selectedTagIds}
              tags={tags}
              onClick={handleClick}
            />
          )
        }
        onClose={isSaving ? undefined : handleClose}
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

export default TagAddModal
