import React from 'react'

import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
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
  withButton
}) => {
  const { t } = useI18n()

  return (
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
          <>
            <TagAddModalContent
              toggleAddNewTagModal={toggleAddNewTagModal}
              selectedTagIds={selectedTagIds}
              tags={tags}
              onClick={onClick}
              withButton={withButton}
            />

            {withButton && (
              <div className="u-p-1">
                <Button
                  fullWidth
                  onClick={onClose}
                  label={t('General.valid')}
                />
              </div>
            )}
          </>
        )
      }
      onClose={isSaving ? undefined : onClose}
    />
  )
}

export default TagAddModal
