import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import BottomSheet, {
  BottomSheetItem
} from 'cozy-ui/transpiled/react/BottomSheet'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Overlay from 'cozy-ui/transpiled/react/deprecated/Overlay'
import Button from 'cozy-ui/transpiled/react/Buttons'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Icon from 'cozy-ui/transpiled/react/Icon'
import CrossMediumIcon from 'cozy-ui/transpiled/react/Icons/CrossMedium'

import TagAddModalContent from 'components/Tag/TagAddModalContent'

const styles = {
  crossButton: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.25rem'
  }
}

const TagBottomSheet = ({
  tags,
  selectedTagIds,
  isSaving,
  isLoading,
  toggleAddNewTagModal,
  onClick,
  onClose,
  onConfirm,
  title,
  disabled,
  withCloseBtn
}) => {
  const { t } = useI18n()

  if (isSaving || isLoading)
    return (
      <Overlay className="u-flex u-flex-items-center u-flex-justify-center">
        <Spinner size="xlarge" color="white" />
      </Overlay>
    )

  return (
    <BottomSheet backdrop onClose={onClose} settings={{ mediumHeightRatio: 1 }}>
      <BottomSheetItem disableGutters disableElevation>
        {withCloseBtn && (
          <IconButton
            size="medium"
            onClick={onClose}
            style={styles.crossButton}
          >
            <Icon icon={CrossMediumIcon} size={12} />
          </IconButton>
        )}
        <Typography variant="h6" align="center" paragraph>
          {title}
        </Typography>
        <Divider />
        <div
          style={{
            maxHeight: '20rem',
            overflowY: 'auto',
            margin: '0.5rem 0'
          }}
          onTouchStart={e => e.stopPropagation()}
        >
          <TagAddModalContent
            toggleAddNewTagModal={toggleAddNewTagModal}
            selectedTagIds={selectedTagIds}
            tags={tags}
            onClick={onClick}
          />
        </div>
        <Divider />
        <div className="u-p-1">
          <Button
            fullWidth
            onClick={onConfirm}
            label={t('General.valid')}
            disabled={disabled}
          />
        </div>
      </BottomSheetItem>
    </BottomSheet>
  )
}

TagBottomSheet.defaultProps = {
  withCloseBtn: false
}

export default TagBottomSheet
