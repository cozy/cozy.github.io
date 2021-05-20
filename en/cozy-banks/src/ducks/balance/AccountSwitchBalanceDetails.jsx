import React from 'react'
import { AccountSwitch } from 'ducks/account'

export const AccountSwitchBalanceDetails = ({ accountSwitchSize }) => {
  return <AccountSwitch size={accountSwitchSize} theme="inverted" />
}

export default React.memo(AccountSwitchBalanceDetails)
