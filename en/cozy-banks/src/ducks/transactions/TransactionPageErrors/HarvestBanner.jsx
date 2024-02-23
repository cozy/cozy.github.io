import PropTypes from 'prop-types'
import React from 'react'

import { useQuery, hasQueryBeenLoaded } from 'cozy-client'
import { LaunchTriggerCard } from 'cozy-harvest-lib'
import Skeleton from 'cozy-ui/transpiled/react/Skeleton'

import { buildKonnectorBySlug, buildAccountById } from 'lib/queries'

const HarvestBanner = ({ trigger, onContentUpdate, active }) => {
  const accountId = trigger.message?.account
  const accountQuery = buildAccountById(accountId)
  const accountResult = useQuery(accountQuery.definition, accountQuery.options)

  const konnectorSlug = trigger.message?.konnector
  const konnectorQuery = buildKonnectorBySlug(konnectorSlug)
  const konnectorResult = useQuery(
    konnectorQuery.definition,
    konnectorQuery.options
  )

  if (
    hasQueryBeenLoaded(konnectorResult) &&
    hasQueryBeenLoaded(accountResult)
  ) {
    if (active && typeof onContentUpdate === 'function') {
      onContentUpdate()
    }
    return (
      <LaunchTriggerCard
        flowProps={{
          initialTrigger: trigger,
          konnector: konnectorResult.data
        }}
        konnectorRoot={`harvest/${konnectorSlug}`}
        account={accountResult.data}
      />
    )
  }

  return <Skeleton height={48} />
}

HarvestBanner.propTypes = {
  konnector: PropTypes.object,
  account: PropTypes.object
}

export default HarvestBanner
