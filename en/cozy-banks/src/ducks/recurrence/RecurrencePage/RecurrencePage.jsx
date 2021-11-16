import React, { useEffect } from 'react'
import { useQuery, isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'
import { recurrenceConn, RECURRENCE_DOCTYPE } from 'doctypes'

import Loading from 'components/Loading'
import { useHistory, useParams } from 'components/RouterContext'
import useDocument from 'components/useDocument'
import BarTheme from 'ducks/bar/BarTheme'
import { useTrackPage } from 'ducks/tracking/browser'
import BundleTransactions from 'ducks/recurrence/RecurrencePage/BundleTransactions'
import BundleInfo from 'ducks/recurrence/RecurrencePage/BundleInfo'

const RecurrencePage = () => {
  const params = useParams()
  const history = useHistory()
  const recurrenceCol = useQuery(recurrenceConn.query, recurrenceConn)

  const bundleId = params.bundleId
  const bundle = useDocument(RECURRENCE_DOCTYPE, bundleId)
  const shouldShowLoading =
    isQueryLoading(recurrenceCol) && !hasQueryBeenLoaded(recurrenceCol)

  useTrackPage('recurrences:details')

  useEffect(() => {
    // If the recurrence gets deleted, there is no bundle anymore and
    // we redirect to the recurrence list
    if (!shouldShowLoading && !bundle) {
      history.push('/analysis/recurrence')
    }
  }, [shouldShowLoading, bundle, history])

  if (shouldShowLoading) {
    return <Loading />
  }

  return (
    <>
      <BarTheme theme="primary" />
      {bundle && (
        <>
          <BundleInfo bundle={bundle} />
          <BundleTransactions bundle={bundle} />
        </>
      )}
    </>
  )
}

export default RecurrencePage
