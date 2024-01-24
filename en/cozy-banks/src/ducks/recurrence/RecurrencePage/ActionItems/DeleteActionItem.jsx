import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { ActionMenuItem } from 'cozy-ui/transpiled/react/deprecated/ActionMenu'
import Icon from 'cozy-ui/transpiled/react/Icon'
import TrashIcon from 'cozy-ui/transpiled/react/Icons/Trash'
import Typography from 'cozy-ui/transpiled/react/Typography'

const DeleteActionItem = ({ onClick }) => {
  const { t } = useI18n()
  return (
    <ActionMenuItem onClick={onClick} left={<Icon icon={TrashIcon} />}>
      {t('Recurrence.action-menu.delete')}
      <br />
      <Typography variant="caption" color="textSecondary">
        {t('Recurrence.action-menu.delete-caption')}
      </Typography>
    </ActionMenuItem>
  )
}

export default React.memo(DeleteActionItem)
