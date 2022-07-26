import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import BottomSheet, {
  BottomSheetItem
} from 'cozy-ui/transpiled/react/BottomSheet'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Divider from 'cozy-ui/transpiled/react/MuiCozyTheme/Divider'
import Overlay from 'cozy-ui/transpiled/react/Overlay'

import TagAddModalContent from 'components/Tag/TagAddModalContent'

const TagBottomSheet = ({
  tags,
  selectedTagIds,
  isSaving,
  isLoading,
  toggleAddNewTagModal,
  onClick,
  onClose
}) => {
  const { t } = useI18n()

  if (isSaving || isLoading)
    return (
      <Overlay className="u-flex u-flex-items-center u-flex-justify-center">
        <Spinner size="xlarge" color="white" />
      </Overlay>
    )

  return (
    <BottomSheet backdrop onClose={onClose}>
      <BottomSheetItem disableGutters disableElevation>
        <Typography variant="h6" align="center" paragraph>
          {t('Tag.add-tag')}
        </Typography>
        <Divider />
        <TagAddModalContent
          toggleAddNewTagModal={toggleAddNewTagModal}
          selectedTagIds={selectedTagIds}
          tags={tags}
          onClick={onClick}
        />
      </BottomSheetItem>
    </BottomSheet>
  )
}

export default TagBottomSheet
