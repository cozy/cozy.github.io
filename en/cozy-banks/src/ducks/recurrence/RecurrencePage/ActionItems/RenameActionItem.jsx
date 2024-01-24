import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { ActionMenuItem } from 'cozy-ui/transpiled/react/deprecated/ActionMenu'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PenIcon from 'cozy-ui/transpiled/react/Icons/Pen'

const RenameActionItem = ({ onClick }) => {
  const { t } = useI18n()
  return (
    <ActionMenuItem onClick={onClick} left={<Icon icon={PenIcon} />}>
      {t('Recurrence.action-menu.rename')}
    </ActionMenuItem>
  )
}

export default React.memo(RenameActionItem)
