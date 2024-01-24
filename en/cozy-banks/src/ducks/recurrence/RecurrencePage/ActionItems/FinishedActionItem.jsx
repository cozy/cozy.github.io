import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import {
  ActionMenuItem,
  ActionMenuRadio
} from 'cozy-ui/transpiled/react/deprecated/ActionMenu'

import { isFinished } from 'ducks/recurrence/api'

const FinishedActionItem = ({ recurrence, onClick }) => {
  const { t } = useI18n()
  return (
    <ActionMenuItem
      onClick={onClick}
      left={<ActionMenuRadio readOnly checked={isFinished(recurrence)} />}
    >
      {t('Recurrence.action-menu.finished')}
    </ActionMenuItem>
  )
}

export default React.memo(FinishedActionItem)
