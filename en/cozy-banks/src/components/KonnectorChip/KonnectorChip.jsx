import React from 'react'
import PropTypes from 'prop-types'
import Chip from 'cozy-ui/transpiled/react/deprecated/Chip'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'

const DumbKonnectorChip = props => {
  const { t } = useI18n()
  const { konnectorType, ...rest } = props

  return (
    <Chip
      className="u-mb-0"
      size="small"
      variant="dashed"
      theme="primary"
      {...rest}
    >
      <Icon icon={PlusIcon} className="u-mr-half" />
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

const KonnectorChip = DumbKonnectorChip

export default KonnectorChip
