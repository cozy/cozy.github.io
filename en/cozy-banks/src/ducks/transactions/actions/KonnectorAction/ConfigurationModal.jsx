import React from 'react'
import PropTypes from 'prop-types'
import BrowserConfigurationModal from 'ducks/transactions/actions/KonnectorAction/BrowserConfigurationModal'

const ConfigurationModal = props => <BrowserConfigurationModal {...props} />

ConfigurationModal.propTypes = {
  dismissAction: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  slug: PropTypes.string.isRequired
}

export default ConfigurationModal
