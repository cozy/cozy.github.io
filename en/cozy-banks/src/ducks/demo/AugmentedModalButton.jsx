import React from 'react'
import ButtonAction from 'cozy-ui/transpiled/react/ButtonAction'
import AugmentedModal from './AugmentedModal'
import styles from 'ducks/transactions/TransactionActions.styl'

class AugmentedModalButton extends React.Component {
  state = { opened: false }

  open = event => {
    event.stopPropagation()
    this.setState({ opened: true })
  }

  close = event => {
    event.stopPropagation()
    this.setState({ opened: false })
  }

  render() {
    const { fileId, text, compact, transaction } = this.props
    return (
      <ButtonAction
        onClick={this.open}
        label={text}
        compact={compact}
        rightIcon="file"
        className={styles.TransactionActionButton}
      >
        {this.state.opened && (
          <AugmentedModal
            transaction={transaction}
            fileId={fileId}
            onClose={this.close}
          />
        )}
      </ButtonAction>
    )
  }
}

export default AugmentedModalButton
