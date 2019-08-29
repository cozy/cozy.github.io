/* global __TARGET__ */

import React from 'react'
import PropTypes from 'prop-types'
import BrowserConfigurationModal from 'ducks/transactions/actions/KonnectorAction/BrowserConfigurationModal'
import MobileConfigurationModal from 'ducks/transactions/actions/KonnectorAction/MobileConfigurationModal'

const ConfigurationModal = props => {
  if (__TARGET__ === 'browser') {
    return <BrowserConfigurationModal {...props} />
  } else if (__TARGET__ === 'mobile') {
    return <MobileConfigurationModal {...props} />
  }
}

ConfigurationModal.propTypes = {
  dismissAction: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  slug: PropTypes.string.isRequired
}

export default ConfigurationModal
