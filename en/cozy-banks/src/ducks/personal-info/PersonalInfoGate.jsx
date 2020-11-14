import React, { useCallback } from 'react'
import flag from 'cozy-flags'
import { useQuery, hasQueryBeenLoaded, useClient } from 'cozy-client'

import { useRouter } from 'components/RouterContext'
import { older30s } from 'doctypes'
import Loading from 'components/Loading'

import {
  identitiesQuery,
  getDefaultIdentitySelector,
  isIdentitySufficientlyFilled
} from './utils'
import PersonalInfoDialog from './PersonalInfoDialog'

const hasQueryErrored = col => {
  return Boolean(col.lastError)
}

const PersonalInfoGate = ({ children }) => {
  const personalInfoActive = flag('banks.transfers.need-personal-information')
  const client = useClient()
  const query = identitiesQuery(getDefaultIdentitySelector(client))
  const identityCol = useQuery(query, {
    as: 'current-app-identity',
    fetchPolicy: state => !state.lastError || older30s(state)
  })

  const router = useRouter()
  const handleClose = useCallback(() => {
    router.push('/balances')
  }, [router])

  if (!hasQueryBeenLoaded(identityCol) && !hasQueryErrored(identityCol)) {
    return <Loading />
  }

  const identity =
    identityCol.data && identityCol.data.length > 0 && identityCol.data[0]

  if (isIdentitySufficientlyFilled(identity) || !personalInfoActive) {
    return children
  } else {
    return (
      <>
        {children}
        <PersonalInfoDialog onClose={handleClose} />
      </>
    )
  }
}

export default PersonalInfoGate
