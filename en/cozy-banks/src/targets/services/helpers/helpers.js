import last from 'lodash/last'
import get from 'lodash/get'
import errors from 'errors'
import logger from 'cozy-logger'

const log = logger.namespace('services')

/**
 * Returns the changes or all documents. If we want to fetch all changes, it is
 * more efficient to fetch all the documents, because we don't have to check the
 * whole history of each document.
 *
 * @param {CozyClient} client - A cozy client
 * @param {string} doctype - The doctype of which we want the latest changes
 * @param {string} lastSeq - The lastSeq from which you want to fetch the changes. If you give '0', then all documents will be fetched
 *
 * @return {Object} an object containing the `documents` and the `newLastSeq`
 */
export const fetchChangesOrAll = async (client, doctype, lastSeq) => {
  const collection = client.collection(doctype)
  if (lastSeq === '0') {
    // If we want to fetch all changes, it is more efficient to fetch all the
    // documents. But we still need to return a `lastSeq` just as if we really
    // fetched changes. So we fetch only the very last change to have the
    // lastSeq.
    // This should be done first to avoid a race condition: if we fetch all
    // documents then fetch the last change, a document could have been created
    // between the two, and it will not be part of the documents returned. Since
    // the lastSeq includes it, it will not be returned next time either.
    const lastChanges = await collection.fetchChanges({
      since: '',
      descending: true,
      limit: 1
    })

    const { data } = await collection.all({ limit: null })

    return { documents: data, newLastSeq: lastChanges.newLastSeq }
  } else {
    return collection.fetchChanges({
      since: lastSeq,
      include_docs: true
    })
  }
}

const getJobIdFromEnv = env => {
  const cozyJobId = env.COZY_JOB_ID

  if (!cozyJobId) {
    throw new Error(errors.NO_COZY_JOB_ID)
  }

  const jobId = last(cozyJobId.split('/'))

  return jobId
}

const getOptionsFromEnv = async (client, env) => {
  const jobId = getJobIdFromEnv(env)
  const job = await client.fetchJSON('GET', `/jobs/${jobId}`)

  return get(job, 'attributes.message.arguments')
}

const getOptionsFromCLI = argv => {
  try {
    return JSON.parse(argv.slice(-1)[0])
  } catch (e) {
    return {}
  }
}

export const getOptions = async (
  client,
  env = process.env,
  argv = process.argv
) => {
  let optsFromEnv = {}

  try {
    optsFromEnv = await getOptionsFromEnv(client, env)
  } catch (err) {
    if (err.message === errors.NO_COZY_JOB_ID) {
      log(
        'warning',
        'No COZY_JOB_ID in environment variables. Impossible to fetch the job to get its arguments. The service will not receive options passed via job arguments'
      )
    }
  }
  const optsFromCLI = getOptionsFromCLI(argv)

  const options = {
    ...optsFromEnv,
    ...optsFromCLI
  }

  return options
}
