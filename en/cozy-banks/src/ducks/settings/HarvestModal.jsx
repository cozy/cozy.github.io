import React from 'react'
import Dialog from 'cozy-ui/transpiled/react/Dialog'
import { useVaultUnlockContext } from 'cozy-keys-lib'
import { useDialogContext } from 'cozy-harvest-lib/dist/components/DialogContext'
import { DialogCloseButton } from 'cozy-ui/transpiled/react/CozyDialogs'

/**
 * This component copies the functionality of the modal in Harvest and its Routes component.
 */
const HarvestModal = ({ children, onDismiss }) => {
  const { showingUnlockForm } = useVaultUnlockContext()
  const dialogContext = useDialogContext()

  if (showingUnlockForm) {
    return null
  }

  return (
    <Dialog disableRestoreFocus {...dialogContext.dialogProps}>
      <DialogCloseButton onClick={onDismiss} />
      {children}
    </Dialog>
  )
}

export default HarvestModal
