import React, { Component } from 'react'
import cx from 'classnames'
import Modal, { ModalDescription } from 'cozy-ui/react/Modal'
import Panel from 'cozy-ui/react/Panel'
import { withClient } from 'cozy-client'
import IntentIframe from 'cozy-ui/react/IntentIframe'
import styles from './AugmentedModal.styl'
import { Intents } from 'cozy-interapp'
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

class AugmentedModal extends Component {
  constructor(props, context) {
    super(props, context)
    this.intents = new Intents({ client: props.client })
  }

  render() {
    const { onClose, fileId, transaction } = this.props
    const vendor = getTransactionVendor(transaction)
    const { Header, Side } = componentsPerTransactionVendor[vendor]
    return (
      <Modal
        into="body"
        dismissAction={onClose}
        size="xxlarge"
        overflowHidden={true}
      >
        {Header && <Header transaction={transaction} />}
        <ModalDescription
          className={cx(
            styles.AugmentedModalDescription,
            !Header && styles['AugmentedModalDescription--NoHeader']
          )}
        >
          <Panel.Group>
            <Panel.Main className={styles.AugmentedModalIntent}>
              <IntentIframe
                action="OPEN"
                type="io.cozy.files"
                data={{ id: fileId }}
                create={this.intents.create}
              />
            </Panel.Main>
            <Panel.Side>
              <div className={styles.FakeInfos}>
                <Side transaction={transaction} />
              </div>
            </Panel.Side>
          </Panel.Group>
        </ModalDescription>
      </Modal>
    )
  }
}

export default withClient(AugmentedModal)
