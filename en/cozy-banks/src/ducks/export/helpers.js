import { Q } from 'cozy-client'

import { JOBS_DOCTYPE } from 'doctypes'

/**
 * Check if an export job is in progress
 *
 * @param {CozyClient} client
 */
export const isExportJobInProgress = async client => {
  const { data } = await client.query(
    Q(JOBS_DOCTYPE)
      .partialIndex({
        worker: 'service',
        message: {
          slug: 'banks',
          name: 'export'
        },
        $or: [{ state: 'queued' }, { state: 'running' }]
      })
      .indexFields(['worker', 'message.slug'])
      .sortBy([{ worker: 'asc' }, { 'message.slug': 'asc' }]) // XXX: forces CouchDB to require an index for the query
      .limitBy(1)
  )

  return data.length > 0
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
