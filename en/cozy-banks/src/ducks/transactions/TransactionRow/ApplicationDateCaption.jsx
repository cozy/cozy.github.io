import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'
import LogoutIcon from 'cozy-ui/transpiled/react/Icons/Logout'

import { getApplicationDate } from 'ducks/transactions/helpers'

const ApplicationDateCaption = ({ transaction }) => {
  const { f } = useI18n()
  const applicationDate = getApplicationDate(transaction)

  return (
    <Typography variant="caption" color="textSecondary">
      <Icon size={10} icon={LogoutIcon} /> {f(applicationDate, 'MMMM')}
    </Typography>
  )
}

export default React.memo(ApplicationDateCaption)
