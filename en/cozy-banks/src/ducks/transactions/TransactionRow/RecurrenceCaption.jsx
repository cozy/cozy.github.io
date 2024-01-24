import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'

import { getFrequencyText } from 'ducks/recurrence/utils'

import iconRecurrence from 'assets/icons/icon-recurrence.svg'

const RecurrenceCaption = ({ recurrence }) => {
  const { t } = useI18n()
  const freqText = getFrequencyText(t, recurrence)

  return (
    <Typography variant="caption" color="textSecondary">
      {freqText} <Icon icon={iconRecurrence} size="10" />
    </Typography>
  )
}

export default React.memo(RecurrenceCaption)
