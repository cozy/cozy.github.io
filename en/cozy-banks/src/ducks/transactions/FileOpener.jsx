import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withClient } from 'cozy-client'
import IntentDialogOpener from 'cozy-ui/transpiled/react/IntentDialogOpener'

class FileOpener extends Component {
  render() {
    const { children, fileId, client } = this.props

    const createIntent = client.intents.create.bind(client.intents)

    return (
      <IntentDialogOpener
        fullScreen
        showCloseButton={false}
        action="OPEN"
        create={createIntent}
        doctype="io.cozy.files"
        options={{ id: fileId }}
        iframeProps={{
          wrapperProps: {
            style: { backgroundColor: 'var(--charcoalGrey)' }
          },
          spinnerProps: {
            color: 'white'
          }
        }}
      >
        {children}
      </IntentDialogOpener>
    )
  }
}

FileOpener.propTypes = {
  children: PropTypes.element.isRequired,
  fileId: PropTypes.string.isRequired
}

export default withClient(FileOpener)
