import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import Chip from 'cozy-ui/transpiled/react/Chips'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

const TagAddChip = ({ className, disabled, onClick }) => {
  const { t } = useI18n()

  return (
    <Chip
      style={{ marginBottom: '0.25rem', marginRight: '0.25rem' }}
      className={className}
      variant="ghost"
      icon={<Icon className="u-ml-half" icon={PlusIcon} />}
      label={t('General.tag')}
      clickable
      disabled={disabled}
      onClick={onClick}
    />
  )
}

export default TagAddChip
