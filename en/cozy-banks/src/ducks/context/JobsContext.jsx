/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { JOBS_DOCTYPE } from 'doctypes'
import CozyRealtime from 'cozy-realtime'
import logger from 'cozy-logger'
import isFunction from 'lodash/isFunction'
import PropTypes from 'prop-types'

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
  const realtimeStartedRef = useRef(false)
  const jobsInProgressRef = useRef([])

  const realtime = useMemo(() => {
    return new CozyRealtime({ client })
  }, [client])

  const handleRealtime = data => {
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
    let arr = [...currJobsInProgress]
    if (worker === 'konnector' && hasAccount) {
      if (state === 'running' && !exist) {
        arr.push(msg)
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

      realtime.subscribe('created', JOBS_DOCTYPE, handleRealtime)
      realtime.subscribe('updated', JOBS_DOCTYPE, handleRealtime)
      realtime.subscribe('deleted', JOBS_DOCTYPE, handleRealtime)
    }
  }

  const stopJobsRealtime = () => {
    if (realtimeStartedRef.current) {
      log('info', 'Stop Jobs Realtime')
      realtimeStartedRef.current = false

      realtime.unsubscribe('created', JOBS_DOCTYPE, handleRealtime)
      realtime.unsubscribe('updated', JOBS_DOCTYPE, handleRealtime)
      realtime.unsubscribe('deleted', JOBS_DOCTYPE, handleRealtime)
    }
  }

  // @TODO useRealtime hook
  useEffect(() => {
    startJobsRealtime()
    return () => stopJobsRealtime()
  }, [])

  return (
    <JobsContext.Provider
      value={{
        jobsInProgress,
        hasJobsInProgress: jobsInProgress.length > 0
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
