const fs = require('fs')
const CozyClient = require('cozy-client').default
const { createToken, getLogsFromJob, enableDebug } = require('./admin')
const { getEnvFromClient } = require('./config')

/**
 * Run tasks on a set of cozies. Tasks will be called
 * with a client that has a token.
 *
 * Handles iterations on the set of cozies.
 *
 * @example
 * ```
 * const runner = new TaskRunner({
 *   doctypes: ["io.cozy.triggers"]
 * })
 * ```
 */
class TaskRunner {
  constructor(options) {
    this.doctypes = options.doctypes
    this.clientPerDomain = {}
  }

  async getClient(domain) {
    if (!this.clientPerDomain[domain]) {
      const token = await createToken(domain, this.doctypes)
      const client = new CozyClient({
        uri: 'https://' + domain,
        token
      })
      this.clientPerDomain[domain] = client
    }
    return this.clientPerDomain[domain]
  }

  /**
   *
   * Runs a function on a set of cozies.
   *
   * `task` is a function that will receive a client as 1st argument and possibly
   * other args.
   *
   * `domainedArgs` is an array of
   *
   * - either a string, in this case, it is used as the domain
   * - or an array, in this case, the 1st element of the array is the domain and the
   *   rest is passed as arguments of the task
   *
   * `run` resolves with an array of results (one for each domainedArg), each result
   * being an array where the 1st element is the domain and the 2nd is the result given
   * by the task.
   *
   * This means that you can chain several `run`s, feeding the result of one `run` to
   * the next one.
   *
   * @example
   * ```
   * const multiplyBy2 = (client, n) => {
   *   return n * 2
   * }
   * const domainArgs = [["toto.mycozy.cloud", 1], ["tata.mycozy.cloud", 2]]
   * const domainedDoubles = await runner.run(multiplyBy2, domainArgs)
   * const domainedQuadruples = runner.run(multiplyBy2, domainedDoubles)
   * ```
   */
  async run(task, domainedArgs, options = {}) {
    const results = []
    const optArgs = options.args || []
    for (const domainArg of domainedArgs) {
      const [domain, ...args] =
        typeof domainArg === 'string' ? [domainArg] : domainArg
      const client = await this.getClient(domain)
      const allArgs = [...args, ...optArgs]
      const result = await task(client, ...allArgs)
      if (options.flatten) {
        for (const item of result) {
          results.push([domain, item])
        }
      } else {
        results.push([domain, result])
      }
    }
    return results
  }
}

/**
 * Tasks that can be used with the TaskRunner
 */

/**
 * Runs a konnector and reports its logs to disk.
 * If a konnector cannot be run because no trigger is present, it
 * is silently ignored.
 */
const runKonnectorAndReport = async (client, konnector) => {
  const slug = konnector.slug
  const domain = getDomain(client)
  const konnCol = client.collection('io.cozy.konnectors')
  const jobCol = client.collection('io.cozy.jobs')
  let job
  try {
    job = (await konnCol.launch(slug)).data.attributes
    console.log(`Launched ${konnector.slug} on ${domain}`)
  } catch (e) {
    if (e.message.match(/No trigger found/)) {
      return
    } else {
      console.error(`Error while running ${slug} on ${domain}`)
      throw e
    }
  }

  const finalJob = await jobCol.waitFor(job._id)

  const jobId = finalJob._id
  console.log(
    `Finished job ${job.message.konnector} on domain ${domain}. State is ${finalJob.state} (jobid: ${jobId})`
  )
  const logFilename = `job-${domain}-${job.message.konnector}-${jobId}.txt`
  const env = getEnvFromClient(client)
  await extractLogs(env, jobId, logFilename)
}

/**
 * Updates a konnector on a specific channel
 */
const updateKonnector = async (client, konnector, channel) => {
  const slug = konnector.slug
  const domain = getDomain(client)
  console.log(`Update ${slug} on ${domain} on ${channel}`)
  const konnCol = client.collection('io.cozy.konnectors')
  const {
    data: { attributes: updatedKonn }
  } = await konnCol.update(slug, {
    source: `registry://${slug}/${channel}`
  })
  console.log(`${slug} on ${domain} updated to version ${updatedKonn.version}`)
}

/**
 * Lists konnectors
 *
 * Since it has some options, the task must be "instantiated".
 *
 * @example
 * const listBankingKonnectors = listKonnectors({ filter: isBankingKonnector })
 *
 * @param  {Object} options
 * @param  {Object} options.filter - A function to filter konnectors returned
 */
const listKonnectors = (options = {}) => async client => {
  const konnCol = client.collection('io.cozy.konnectors')
  const { data: konnectors } = await konnCol.all(client)
  if (options.filter) {
    return konnectors.filter(options.filter)
  } else {
    return konnectors
  }
}

const enableDebugTask = client => {
  const domain = getDomain(client)
  console.log(`Enabling debug on ${domain}`)
  return enableDebug(domain)
}

/**
 * Utils
 */
const extractLogs = async (env, jobID, filename) => {
  const logs = await getLogsFromJob(env, jobID)
  console.log(`Extracted job logs to ${filename}`)
  fs.writeFileSync(filename, logs)
}

const getDomain = client => {
  return client.stackClient.uri.replace(/^https?:\/\//, '')
}

module.exports = {
  TaskRunner,
  runKonnectorAndReport,
  updateKonnector,
  listKonnectors,
  enableDebug: enableDebugTask,
  getDomain
}
