import React from 'react'
import { useQuery } from 'cozy-client'
import get from 'lodash/get'
import flag from 'cozy-flags'
import { konnectorTriggersConn } from 'doctypes'
import NoAccount from 'ducks/balance/NoAccount'
import AccountsImporting from 'ducks/balance/AccountsImporting'
import { useBanksContext } from 'ducks/context/BanksContext'

const EmptyAccount = () => {
  const triggersRequest = useQuery(
    konnectorTriggersConn.query,
    konnectorTriggersConn
  )

  const { isBankTrigger, isFetchingBankSlugs } = useBanksContext()

  if (triggersRequest.fetchStatus !== 'loaded' || isFetchingBankSlugs) {
    return null
  }
  let konnectorInfos = triggersRequest.data
    .map(x => x.attributes)
    .filter(isBankTrigger)
    .map(t => ({
      konnector: get(t, 'message.konnector'),
      account: get(t, 'message.account'),
      status: get(t, 'current_state.status')
    }))
  if (flag('banks.balance.account-loading')) {
    if (konnectorInfos.length === 0) {
      konnectorInfos = [
        {
          konnector: 'creditcooperatif148',
          status: 'done'
        },
        {
          konnector: 'labanquepostale44',
          account: 'fakeId',
          status: 'errored'
        }
      ]
    }
  }

  const hasKonnectorRunning = konnectorInfos.some(k => k.status === 'running')
  if (hasKonnectorRunning) {
    return <AccountsImporting konnectorInfos={konnectorInfos} />
  }

  return <NoAccount />
}

export default React.memo(EmptyAccount)
