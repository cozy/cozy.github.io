import React, { useMemo } from 'react'
import { useQuery } from 'cozy-client'
import { useSelector } from 'react-redux'

import { appsConn } from 'doctypes'
import { getAppsById, getAppURL } from 'ducks/apps/selectors'

function getAppsURLs(appsById) {
  return {
    MAIF: getAppURL(appsById['io.cozy.apps/maif']),
    HEALTH: getAppURL(appsById['io.cozy.apps/sante']),
    EDF: getAppURL(appsById['io.cozy.apps/edf']),
    COLLECT: getAppURL(appsById['io.cozy.apps/collect']),
    HOME: getAppURL(appsById['io.cozy.apps/home'])
  }
}

const withAppsUrls = Wrapped => {
  const WithAppsUrls = props => {
    useQuery(appsConn.query, appsConn)
    const appsById = useSelector(getAppsById)
    const urls = useMemo(() => getAppsURLs(appsById), [appsById])
    return <Wrapped {...props} urls={urls} />
  }

  WithAppsUrls.displayName = `withAppsUrls<${
    Wrapped.name || Wrapped.displayName
  }>`

  return WithAppsUrls
}

export default withAppsUrls
