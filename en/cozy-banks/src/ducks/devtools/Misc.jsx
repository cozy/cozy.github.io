import React from 'react'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import Typography from 'cozy-ui/transpiled/react/Typography'
import flag from 'cozy-flags'

import { PanelContent } from 'cozy-client/dist/devtools'

const Misc = () => {
  const noAccountChecked = !!flag('balance.no-account')
  const accountLoadingChecked = !!flag('banks.balance.account-loading')

  const toggleNoAccount = () => {
    const noAccountValue = !flag('balance.no-account')

    flag('balance.no-account', noAccountValue)
    if (noAccountValue) {
      flag('banks.balance.account-loading', false)
    }
  }

  const toggleAccountsLoading = () => {
    const accountLoadingValue = !flag('banks.balance.account-loading')

    flag('banks.balance.account-loading', accountLoadingValue)
    if (accountLoadingValue) {
      flag('balance.no-account', false)
    }
  }

  return (
    <PanelContent>
      <Typography variant="subtitle1" gutterBottom>
        Misc
      </Typography>
      <Checkbox
        defaultChecked={noAccountChecked}
        label="Display no account page"
        onClick={toggleNoAccount}
      />
      <Checkbox
        defaultChecked={accountLoadingChecked}
        label="Display accounts loading"
        onClick={toggleAccountsLoading}
      />
    </PanelContent>
  )
}

export default Misc
