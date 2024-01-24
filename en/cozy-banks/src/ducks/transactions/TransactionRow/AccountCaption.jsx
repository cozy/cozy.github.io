import React from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import Typography from 'cozy-ui/transpiled/react/Typography'

import {
  getAccountLabel,
  getAccountInstitutionLabel
} from 'ducks/account/helpers'

const AccountCaption = ({ account }) => {
  const { t } = useI18n()

  const accountInstitutionLabel = getAccountInstitutionLabel(account)

  return (
    <Typography className="u-ellipsis" variant="caption" color="textSecondary">
      {getAccountLabel(account, t)}
      {accountInstitutionLabel && ` - ${accountInstitutionLabel}`}
    </Typography>
  )
}

export default React.memo(AccountCaption)
