import React from 'react'

import Typography from 'cozy-ui/transpiled/react/Typography'

import {
  getAccountLabel,
  getAccountInstitutionLabel
} from 'ducks/account/helpers'

const AccountCaption = ({ account }) => {
  const accountInstitutionLabel = getAccountInstitutionLabel(account)

  return (
    <Typography className="u-ellipsis" variant="caption" color="textSecondary">
      {getAccountLabel(account)}
      {accountInstitutionLabel && ` - ${accountInstitutionLabel}`}
    </Typography>
  )
}

export default React.memo(AccountCaption)
