/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { JOBS_DOCTYPE } from 'doctypes'
import logger from 'cozy-logger'
import isFunction from 'lodash/isFunction'
import PropTypes from 'prop-types'
import { WaitJobQueue } from '../settings/WaitJobQueue'

const log = logger.namespace('import.context')

export const JobsContext = createContext({})

export const useJobsContext = () => {
  return useContext(JobsContext)
}

/** Allows to subscribe to jobs and thus to know jobs in progress
 *
 * @param client
 * @param options
 * @returns jobsInProgress
 */
const JobsProvider = ({ children, client, options = {} }) => {
  const [jobsInProgress, setJobsInProgress] = useState([])
  const [waitJobsInProgress, setWaitJobsInProgress] = useState([])
  const realtimeStartedRef = useRef(false)
  const jobsInProgressRef = useRef([])
  let waitJobQueue = null
  useEffect(() => {
    waitJobQueue = new WaitJobQueue({
      setter: setWaitJobsInProgress,
      duration: 15 * 1000
    })
    return () => waitJobQueue.clearInterval()
  }, [])

  const realtime = client.plugins.realtime

  const handleRealtimeJobNotification = ({ data }) => {
    // Add a virtual job in progress on harvest
    // notification because we know job will come, triggered by webhook
    // and we want to display it to the user
    const { slug } = data
    if (slug) {
      const { current: currJobsInProgress } = jobsInProgressRef
      const currentJobWithSameSlug = currJobsInProgress.findIndex(
        j => j.konnector === slug
      )
      if (currentJobWithSameSlug === -1) {
        // no need for a virtual job if a real one is already running
        waitJobQueue.addWaitJob({ slug })
      }
    }
  }

  const handleRealtimeJobEvent = data => {
    const { worker, state, message: msg } = data

    // hack: Using jobsInProgressRef because jobsInProgress (from state)
    // keep its default value
    // The ideal would be to use only jobsInProgress and do not use the ref
    const { current: currJobsInProgress } = jobsInProgressRef
    const index = currJobsInProgress.findIndex(a => a.account === msg.account)
    const exist = index !== -1

    const onSuccess = options.onSuccess
    const onError = options.onError
    const hasAccount = msg.account
    const isConnectionSynced = msg?.event === 'CONNECTION_SYNCED'
    const isBiWebhook = Boolean(msg?.bi_webhook)
    const isAccountDeleted = msg?.account_deleted === true
    let arr = [...currJobsInProgress]
    if (
      worker === 'konnector' &&
      hasAccount &&
      (!isBiWebhook || isConnectionSynced) &&
      !isAccountDeleted
    ) {
      if ((state === 'running' || state === 'done') && !exist) {
        waitJobQueue.removeWaitJob({ slug: msg.konnector })
        if (state !== 'done') {
          arr.push(msg)
        }
      } else if (state === 'done' && exist) {
        arr.splice(index, 1)

        if (isFunction(onSuccess)) {
          onSuccess()
        }
      } else if (state === 'errored' && exist) {
        arr.splice(index, 1)
        if (isFunction(onError)) {
          onError()
        }
      }

      jobsInProgressRef.current = arr
      setJobsInProgress(arr)
    }
  }

  const startJobsRealtime = () => {
    if (!realtimeStartedRef.current) {
      log('info', 'Start Jobs Realtime')
      realtimeStartedRef.current = true

      realtime.subscribe('created', JOBS_DOCTYPE, handleRealtimeJobEvent)
      realtime.subscribe('updated', JOBS_DOCTYPE, handleRealtimeJobEvent)
      realtime.subscribe('deleted', JOBS_DOCTYPE, handleRealtimeJobEvent)
      realtime.subscribe(
        'notified',
        JOBS_DOCTYPE,
        handleRealtimeJobNotification
      )
    }
  }

  const stopJobsRealtime = () => {
    if (realtimeStartedRef.current) {
      log('info', 'Stop Jobs Realtime')
      realtimeStartedRef.current = false

      realtime.unsubscribe('created', JOBS_DOCTYPE, handleRealtimeJobEvent)
      realtime.unsubscribe('updated', JOBS_DOCTYPE, handleRealtimeJobEvent)
      realtime.unsubscribe('deleted', JOBS_DOCTYPE, handleRealtimeJobEvent)
      realtime.unsubscribe(
        'notified',
        JOBS_DOCTYPE,
        handleRealtimeJobNotification
      )
    }
  }

  // @TODO useRealtime hook
  useEffect(() => {
    startJobsRealtime()
    return () => stopJobsRealtime()
  }, [])

  const jobsInProgressAndWait = [...jobsInProgress, ...waitJobsInProgress]
  return (
    <JobsContext.Provider
      value={{
        jobsInProgress: jobsInProgressAndWait,
        hasJobsInProgress: jobsInProgressAndWait.length > 0
      }}
    >
      {children}
    </JobsContext.Provider>
  )
}

export default JobsProvider

/**
 * @function
 * @description HOC to provide import context as prop
 *
 * @param  {Component} Component - wrapped component
 * @returns {Function} - Component that will receive import context as prop
 */
export const withJobsInProgress = Component => {
  const Wrapped = props => {
    const { jobsInProgress = [] } = useJobsContext()
    return <Component {...props} jobsInProgress={jobsInProgress} />
  }
  Wrapped.displayName = `withJobsInProgress(${
    Component.displayName || Component.name
  })`
  return Wrapped
}

JobsProvider.propTypes = {
  client: PropTypes.object.isRequired,
  options: PropTypes.shape({
    onSuccess: PropTypes.func,
    onError: PropTypes.func
  })
}
