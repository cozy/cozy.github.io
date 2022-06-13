import React from 'react'

import AccountModalContent from 'cozy-harvest-lib/dist/components/AccountModal'

const HarvestAccountModal = ({
  accountId,
  triggers,
  konnector,
  accountsAndTriggers,
  onDismiss,
  ...props
}) => {
  return (
    <AccountModalContent
      initialActiveTab="configuration"
      accountId={accountId}
      triggers={triggers}
      konnector={konnector}
      accountsAndTriggers={accountsAndTriggers}
      onDismiss={onDismiss}
      showAccountSelection={false}
      showNewAccountButton={false}
      {...props}
    />
  )
}

export default HarvestAccountModal
