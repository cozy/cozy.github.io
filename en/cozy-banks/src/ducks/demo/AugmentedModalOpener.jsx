import React from 'react'
import PropTypes from 'prop-types'
import AugmentedModal from './AugmentedModal'

/**
 * This is like a `FileOpener`, but it opens an `AugmentedModal`.
 * This is used for demo purposes only
 */
class AugmentedModalOpener extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node.isRequired
  }

  state = { isOpen: false }

  handleOpen = ev => {
    ev && ev.preventDefault()
    this.setState({ isOpen: true })
  }

  handleClose = ev => {
    ev && ev.preventDefault()
    this.setState({ isOpen: false })
  }

  render() {
    return (
      <>
        {React.cloneElement(this.props.children, { onClick: this.handleOpen })}
        {this.state.isOpen && (
          <AugmentedModal
            onClose={this.handleClose}
            fileId={this.props.fileId}
            transaction={this.props.transaction}
          />
        )}
      </>
    )
  }
}

export default AugmentedModalOpener
