import React, { Component } from 'react'

import { withStyles } from 'cozy-ui/transpiled/react/styles'
import Dialog, { DialogContent } from 'cozy-ui/transpiled/react/Dialog'
import { DialogCloseButton } from 'cozy-ui/transpiled/react/CozyDialogs'
import { withClient } from 'cozy-client'
import IntentIframe from 'cozy-ui/transpiled/react/IntentIframe'
import styles from './AugmentedModal.styl'
import {
  Header as VentePriveeHeader,
  Side as VentePriveeSide
} from './VentePrivee'
import { Side as AmeliSide } from './Ameli'
import { getTransactionVendor } from './helpers'

const componentsPerTransactionVendor = {
  ventePrivee: {
    Header: VentePriveeHeader,
    Side: VentePriveeSide
  },
  ameli: {
    Side: AmeliSide
  }
}
const customStyles = () => ({
  paper: {
    height: '100%'
  }
})

const StyledDialog = withStyles(customStyles)(Dialog)

class AugmentedModal extends Component {
  render() {
    const { onClose, fileId, transaction } = this.props
    const vendor = getTransactionVendor(transaction)

    const { Header, Side } = componentsPerTransactionVendor[vendor]
    return (
      <StyledDialog
        open={true}
        fullWidth={true}
        maxWidth="lg"
        onClose={onClose}
      >
        <DialogCloseButton onClick={onClose} />
        {Header && <Header />}
        <DialogContent className={styles.ContainerIntentSide}>
          <main className={styles.IntentIframeContainer}>
            <IntentIframe
              action="OPEN"
              type="io.cozy.files"
              data={{ id: fileId }}
            />
          </main>
          <aside className={styles.FakeInfos}>
            <Side />
          </aside>
        </DialogContent>
      </StyledDialog>
    )
  }
}

export default withClient(AugmentedModal)
