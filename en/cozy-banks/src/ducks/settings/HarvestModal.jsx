import React from 'react'
import flag from 'cozy-flags'
import Dialog from 'cozy-ui/transpiled/react/Dialog'
import { withStyles } from 'cozy-ui/transpiled/react/styles'
import { useVaultUnlockContext } from 'cozy-keys-lib'
import { useDialogContext } from 'cozy-harvest-lib/dist/components/DialogContext'

const withHarvestDialogStyles = () => {
  /**
   * When this flag is enabled, tabs are removed, and the layout shift between
   * data and configuration screens is not as disturbing as with tabs. So we do
   * not need to customize styles to align the dialog at the top anymore and we
   * can just return the identity function. This whole HOC should be able to be
   * removed at the same time as the flag. See the next comment for the former
   * behavior.
   */
  if (flag('harvest.inappconnectors.enabled')) {
    return component => component
  }
  /**
   * Dialog will not be centered vertically since we need the modal to "stay in
   * place" when changing tabs. Since tabs content's height is not the same
   * between the data tab and the configuration, having the modal vertically
   * centered makes it "jump" when changing tabs.
   */
  return withStyles({
    scrollPaper: {
      alignItems: 'start'
    },

    // Necessary to prevent warnings at runtime
    paper: {}
  })
}

/**
 * This component copies the functionality of the modal in Harvest and its Routes component.
 */
const HarvestModal = ({ children }) => {
  const { showingUnlockForm } = useVaultUnlockContext()
  const dialogContext = useDialogContext()

  if (showingUnlockForm) {
    return null
  }

  return (
    <Dialog disableRestoreFocus {...dialogContext.dialogProps}>
      {children}
    </Dialog>
  )
}

export default withHarvestDialogStyles()(HarvestModal)
