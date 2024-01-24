import React from 'react'

import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Button from 'cozy-ui/transpiled/react/Buttons'

import TagAddModalContent from 'components/Tag/TagAddModalContent'

const TagAddModal = ({
  tags,
  selectedTagIds,
  isSaving,
  isLoading,
  toggleAddNewTagModal,
  onClick,
  onClose,
  onConfirm,
  title,
  disabled
}) => {
  const { t } = useI18n()

  return (
    <ConfirmDialog
      size="small"
      open
      disableGutters
      title={<div className="u-mt-1-half">{title}</div>}
      content={
        isLoading ? (
          <Spinner
            size="xlarge"
            className="u-flex u-flex-justify-center u-mv-1"
          />
        ) : (
          <>
            <TagAddModalContent
              toggleAddNewTagModal={toggleAddNewTagModal}
              selectedTagIds={selectedTagIds}
              tags={tags}
              onClick={onClick}
              isSaving={isSaving}
            />

            <div className="u-p-1">
              <Button
                fullWidth
                onClick={onConfirm}
                label={
                  isSaving
                    ? t('Tag.addingTagToTransaction', {
                        smart_count: selectedTagIds.length
                      })
                    : t('General.valid')
                }
                disabled={disabled}
                busy={isSaving}
              />
            </div>
          </>
        )
      }
      onClose={isSaving ? undefined : onClose}
    />
  )
}

export default TagAddModal
