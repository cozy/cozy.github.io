import React from 'react'
import Dialog, { DialogTitle } from 'cozy-ui/transpiled/react/Dialog'
import {
  DialogCloseButton,
  useCozyDialog
} from 'cozy-ui/transpiled/react/CozyDialogs'

const RawContentDialog = props => {
  const { title, content, onClose } = props
  const { dialogProps, dialogTitleProps } = useCozyDialog(props)
  return (
    <Dialog {...dialogProps} onClose={onClose}>
      <DialogCloseButton onClick={onClose} />
      <DialogTitle {...dialogTitleProps}>{title}</DialogTitle>
      {content}
    </Dialog>
  )
}

export default RawContentDialog
