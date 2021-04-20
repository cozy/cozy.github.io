import { useState, useEffect } from 'react'
import { Registry } from 'cozy-client'

// TODO Must use useAppsInMaintenance from cozy-client
// https://github.com/cozy/cozy-client/pull/924
const useAppsInMaintenance = client => {
  const [appsInMaintenance, setAppsInMaintenance] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const registry = new Registry({
        client
      })
      const newAppsInMaintenance = await registry.fetchAppsInMaintenance()
      setAppsInMaintenance(newAppsInMaintenance || [])
    }
    fetchData()
  }, [client])

  return appsInMaintenance
}

export default useAppsInMaintenance
