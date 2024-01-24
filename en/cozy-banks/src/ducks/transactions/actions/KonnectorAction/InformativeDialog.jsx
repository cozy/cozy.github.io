import React from 'react'
import PropTypes from 'prop-types'
import { IllustrationDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Stack from 'cozy-ui/transpiled/react/Stack'
import Icon from 'cozy-ui/transpiled/react/Icon'
import iconCollectAccount from 'assets/icons/icon-collect-account.svg'

const InformativeDialog = ({
  onCancel,
  onConfirm,
  title,
  description,
  caption,
  cancelText,
  confirmText
}) => (
  <IllustrationDialog
    open
    size="small"
    onClose={onCancel}
    title={
      <Stack spacing="m" className="u-ta-center">
        <Icon
          icon={iconCollectAccount}
          width={192}
          height={112}
          className="u-m-auto"
        />
        <Typography variant="h4">{title}</Typography>
      </Stack>
    }
    content={
      <>
        <Typography tag="p">{description}</Typography>
        <Typography variant="caption" tag="p" color="textSecondary">
          {caption}
        </Typography>
      </>
    }
    actions={
      <>
        <Button
          className="u-flex-grow-1"
          onClick={onCancel}
          theme="secondary"
          label={cancelText}
        />
        <Button
          className="u-flex-grow-1"
          onClick={onConfirm}
          label={confirmText}
        />
      </>
    }
  />
)

InformativeDialog.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  caption: PropTypes.string.isRequired,
  cancelText: PropTypes.string.isRequired,
  confirmText: PropTypes.string.isRequired
}

export default InformativeDialog
