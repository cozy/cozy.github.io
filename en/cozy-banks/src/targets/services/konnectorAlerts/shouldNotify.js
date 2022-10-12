import get from 'lodash/get'

import { Q } from 'cozy-client'

import { JOBS_DOCTYPE } from 'doctypes'
import {
  getKonnectorSlug,
  fetchRegistryInfo,
  isErrorActionable,
  isOlderThan
} from 'targets/services/konnectorAlerts/helpers'

/**
 * Returns whether we need to send a notification for a trigger
 *
 * @typedef {Object} ShouldNotifyResult
 * @property {boolean} ok - Whether the trigger generates a notification
 * @property {string} reason - If ok=false, describes why.
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

  // We do not want to send notifications for connectors that failed a long time
  // ago without any retry since then.
  // The last reminder is scheduled 7 days after the last failure plus a few
  // minutes, with a maximum of 15 minutes, so we prevent notifications to be
  // sent if we're past that delay.
  if (
    isOlderThan(trigger.current_state.last_failure, { days: 7, minutes: 15 })
  ) {
    return { ok: false, reason: 'last-failure-too-old' }
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
