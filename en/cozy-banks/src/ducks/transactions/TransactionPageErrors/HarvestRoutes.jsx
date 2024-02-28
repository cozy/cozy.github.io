import React, { useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { useQuery } from 'cozy-client'
import { Routes } from 'cozy-harvest-lib'

import {
  buildTriggersQueryByKonnectorSlug,
  buildKonnectorBySlug
} from 'lib/queries'

const HarvestRoutes = () => {
  const { connectorSlug } = useParams()
  const navigate = useNavigate()

  const queryTriggers = buildTriggersQueryByKonnectorSlug(
    connectorSlug,
    Boolean(connectorSlug)
  )
  const { data: triggers } = useQuery(
    queryTriggers.definition,
    queryTriggers.options
  )
  const trigger = triggers?.[0]

  const queryKonnector = buildKonnectorBySlug(connectorSlug, Boolean(trigger))
  const { data: konnector } = useQuery(
    queryKonnector.definition,
    queryKonnector.options
  )

  const konnectorWithTriggers =
    konnector && trigger
      ? { ...konnector, triggers: { data: triggers } }
      : undefined

  const onDismiss = useCallback(() => {
    navigate('..')
  }, [navigate])

  return (
    <Routes
      konnectorRoot="/balances/harvest/details"
      konnector={konnectorWithTriggers}
      konnectorSlug={connectorSlug}
      onSuccess={onDismiss}
      onDismiss={onDismiss}
    />
  )
}

export default HarvestRoutes
