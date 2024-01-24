import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'
import {
  ActionMenuItem,
  ActionMenuRadio
} from 'cozy-ui/transpiled/react/deprecated/ActionMenu'

import { isOngoing } from 'ducks/recurrence/api'

const OngoingActionItem = ({ recurrence, onClick }) => {
  const { t } = useI18n()
  return (
    <ActionMenuItem
      onClick={onClick}
      left={<ActionMenuRadio readOnly checked={isOngoing(recurrence)} />}
    >
      {t('Recurrence.action-menu.ongoing')}
      <br />
      <Typography variant="caption" color="textSecondary">
        {t('Recurrence.action-menu.ongoing-caption')}
      </Typography>
    </ActionMenuItem>
  )
}

export default React.memo(OngoingActionItem)
