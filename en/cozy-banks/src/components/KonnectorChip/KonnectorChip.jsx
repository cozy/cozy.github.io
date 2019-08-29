import React from 'react'
import PropTypes from 'prop-types'
import Chip from 'cozy-ui/react/Chip'
import Icon from 'cozy-ui/react/Icon'
import { translate } from 'cozy-ui/react'

const DumbKonnectorChip = props => {
  const { t, konnectorType, ...rest } = props

  return (
    <Chip size="small" variant="dashed" theme="primary" {...rest}>
      <Icon icon="plus" className="u-mr-half" />
      {t(`KonnectorChip.${konnectorType}`)}
    </Chip>
  )
}

DumbKonnectorChip.propTypes = {
  konnectorType: PropTypes.oneOf(['health', 'generic'])
}

DumbKonnectorChip.defaultProps = {
  konnectorType: 'generic'
}

const KonnectorChip = translate()(DumbKonnectorChip)

export default KonnectorChip
