import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import BottomSheet, {
  BottomSheetItem,
  BottomSheetHeader
} from 'cozy-ui/transpiled/react/BottomSheet'
import Typography from 'cozy-ui/transpiled/react/Typography'

import TagAddModalContent from 'components/Tag/TagAddModalContent'

const TagBottomSheet = () => {
  const { t } = useI18n()

  return (
    <BottomSheet hidden fullHeight={false}>
      <BottomSheetHeader className="u-ph-1 u-pb-1">
        <Typography variant="h6">{t('Tag.add-tag')}</Typography>
      </BottomSheetHeader>
      <BottomSheetItem disableGutters>
        <TagAddModalContent />
      </BottomSheetItem>
    </BottomSheet>
  )
}

export default TagBottomSheet
