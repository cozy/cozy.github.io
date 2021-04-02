/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Q } from 'cozy-client'
import { KONNECTOR_DOCTYPE } from 'doctypes'
import { useJobsContext } from 'ducks/context/JobsContext'

export const BanksContext = createContext({})

export const useBanksContext = () => {
  return useContext(BanksContext)
}

/**
 * BanksProvider
 *
 * @param children
 * @param client
 * @returns {JSX.Element}
 * @constructor
 */

const EMPTY_ARRAY = []
const BanksProvider = ({ children, client }) => {
  const { jobsInProgress = [] } = useJobsContext()
  const [banksJobsInProgress, setBanksJobsInProgress] = useState([])

  useEffect(() => {
    if (jobsInProgress.length > 0) {
      const queryJobsInProgress = async () => {
        const ids = jobsInProgress.map(jobsInProgress => {
          const slug = jobsInProgress.konnector
          return `${KONNECTOR_DOCTYPE}/${slug}`
        })
        const resp = await client.query(Q(KONNECTOR_DOCTYPE).getByIds(ids))
        const newJobInProgress = resp.data.map(konnector => {
          const slug = konnector.slug
          const jobInProgress = jobsInProgress.find(j => j.konnector === slug)
          return {
            konnector: slug,
            account: jobInProgress.account,
            institutionLabel: konnector.name
          }
        })
        return newJobInProgress
      }

      queryJobsInProgress().then(formatJobs => {
        setBanksJobsInProgress(formatJobs)
      })
    } else {
      setBanksJobsInProgress(EMPTY_ARRAY)
    }
  }, [jobsInProgress])

  return (
    <BanksContext.Provider
      value={{
        jobsInProgress: banksJobsInProgress,
        hasJobsInProgress: banksJobsInProgress.length > 0
      }}
    >
      {children}
    </BanksContext.Provider>
  )
}

export default BanksProvider

BanksProvider.propTypes = {
  client: PropTypes.object.isRequired
}
