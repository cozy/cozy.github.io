import { JOBS_DOCTYPE } from 'src/doctypes'

/**
 * Find export job in progress
 *
 * @param {CozyClient} client
 */
export const isExportJobInProgress = async client => {
  const jobColl = client.collection(JOBS_DOCTYPE)
  // This method return all jobs queued or running state
  const { data: allJobsServiceQueuedOrRunning } = await jobColl.queued(
    'service'
  )

  return allJobsServiceQueuedOrRunning.some(
    job =>
      job.attributes.message.slug === 'banks' &&
      job.attributes.message.name === 'export'
  )
}

/**
 * Launch export job
 *
 * @param {CozyClient} client
 */
export const launchExportJob = async client => {
  const exportJobInProgress = await isExportJobInProgress(client)

  if (!exportJobInProgress) {
    const jobColl = client.collection(JOBS_DOCTYPE)
    await jobColl.create('service', { slug: 'banks', name: 'export' }, {}, true)
  }
}
