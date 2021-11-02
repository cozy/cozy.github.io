import get from 'lodash/get'

import { Q } from 'cozy-client'

import { JOBS_DOCTYPE } from 'doctypes'
import {
  getKonnectorSlug,
  fetchRegistryInfo,
  isErrorActionable
} from './helpers'

/**
 * Returns whether we need to send a notification for a trigger
 *
 * @typedef {Object} ShouldNotifyResult
 * @property {number} ok - Whether the trigger generates a notification
 * @property {number} reason - If ok=false, describes why.
 *
 * @return {ShouldNotifyResult}
 */
export const shouldNotify = async ({ client, trigger, previousStates }) => {
  const previousState = previousStates[trigger._id]

  if (!previousState) {
    return { ok: false, reason: 'no-previous-state' }
  }

  if (trigger.current_state.status !== 'errored') {
    return { ok: false, reason: 'current-state-is-not-errored' }
  }

  if (!isErrorActionable(trigger.current_state.last_error)) {
    return { ok: false, reason: 'error-not-actionable' }
  }

  if (!trigger.current_state.last_success) {
    return { ok: false, reason: 'never-been-in-success' }
  }

  if (
    previousState.status === 'errored' &&
    isErrorActionable(previousState.last_error)
  ) {
    return { ok: false, reason: 'last-failure-already-notified' }
  }

  // We do not want to send notifications for jobs that were launched manually
  // Except if the trigger that runs the service is a scheduled one
  const jobId = trigger.current_state.last_executed_job_id
  const { data: job } = await client.query(Q(JOBS_DOCTYPE).getById(jobId))
  if (job.manual_execution) {
    return { ok: false, reason: 'manual-job' }
  }

  const registryInfo = await fetchRegistryInfo(
    client,
    getKonnectorSlug(trigger)
  )
  const categories = get(registryInfo, 'latest_version.manifest.categories')

  if (!categories || !categories.includes('banking')) {
    return { ok: false, reason: 'not-banking-konnector' }
  }

  if (registryInfo.maintenance_activated) {
    return { ok: false, reason: 'maintenance' }
  }

  return { ok: true }
}
