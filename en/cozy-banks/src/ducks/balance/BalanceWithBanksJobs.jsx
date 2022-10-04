import React from 'react'
import { useBanksContext } from 'ducks/context/BanksContext'
import Balance from 'ducks/balance/Balance'

const BalanceWithBanksJobs = () => {
  const { hasJobsInProgress } = useBanksContext()
  return <Balance hasJobsInProgress={hasJobsInProgress} />
}

export default BalanceWithBanksJobs
