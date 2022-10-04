/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import PropTypes from 'prop-types'
import CozyClient, { Q } from 'cozy-client'
import { KONNECTOR_DOCTYPE } from 'doctypes'
import { useJobsContext } from 'ducks/context/JobsContext'
import useBankingSlugs from 'hooks/useBankingSlugs'

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
  const { isFetchingBankSlugs, isBankKonnector, bankingSlugs, isBankTrigger } =
    useBankingSlugs()

  const onlyBanksInProgress = useMemo(
    () => jobsInProgress.filter(isBankKonnector),
    [jobsInProgress, isFetchingBankSlugs]
  )

  useEffect(() => {
    if (onlyBanksInProgress.length > 0) {
      const queryJobsInProgress = async () => {
        const ids = onlyBanksInProgress.map(jobsInProgress => {
          const slug = jobsInProgress.konnector
          return `${KONNECTOR_DOCTYPE}/${slug}`
        })
        // use client.fetchQueryAndGetFromState to avoid a null response on second call. see
        // https://github.com/cozy/cozy-client/issues/931#issuecomment-1065010796
        const resp = await client.fetchQueryAndGetFromState({
          definition: Q(KONNECTOR_DOCTYPE).getByIds(ids),
          options: {
            as: 'io.cozy.konnectors/in-progress',
            fetchPolicy: CozyClient.fetchPolicies.olderThan(30 * 1000)
          }
        })
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
      // eslint-disable-next-line
      queryJobsInProgress().then(formatJobs => {
        setBanksJobsInProgress(formatJobs)
      })
    } else {
      setBanksJobsInProgress(EMPTY_ARRAY)
    }
  }, [jobsInProgress, isFetchingBankSlugs])
  return (
    <BanksContext.Provider
      value={{
        jobsInProgress: banksJobsInProgress,
        hasJobsInProgress: banksJobsInProgress.length > 0,
        isFetchingBankSlugs,
        isBankKonnector,
        bankingSlugs,
        isBankTrigger
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
