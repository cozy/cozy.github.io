const DEFAULT_DURATION = 1000 * 60 * 5 // 5 minutes
const INTERVAL = 10 * 1000 // 10 seconds

/**
 * Implement a wait queue of virtual jobs which have sense when harvest told banks a new banking job will come.
 */
export class WaitJobQueue {
  /**
   * @constructor
   * @param {Object} options
   * @param {Function} options.setter - setter function called when the internal queue has changed
   * @param {Number} options.duration - time to wait for the real job to come (in ms). default: 5 minutes
   */
  constructor({ setter, duration = DEFAULT_DURATION }) {
    this.setter = setter
    this.queue = []
    this.duration = duration
    this.setIntervalId = null
  }

  /**
   * Check if timeout is exceeded for each job and removes them when needed
   */
  checkWaitJobQueue() {
    const currentTime = Date.now()
    for (const job of this.queue) {
      if (currentTime > job.timeout) {
        this.removeWaitJob({ slug: job.konnector })
      }
    }
  }

  /**
   * Add a job to the queue
   *
   * @param {Object} options
   * @param {String} options.slug - slug of the job
   */
  addWaitJob({ slug }) {
    const queue = [...this.queue]
    const jobWithSameSlugIndex = queue.findIndex(job => job.konnector === slug)
    const timeout = Date.now() + DEFAULT_DURATION
    if (jobWithSameSlugIndex !== -1) {
      queue[jobWithSameSlugIndex].timeout = timeout
    } else {
      queue.push({ konnector: slug, timeout, wait: true })
      this.setter(queue)
    }
    this.queue = queue

    if (this.setIntervalId === null) {
      this.initInterval()
    }
  }

  /**
   * Remove a job from the queue, identified by its slug.
   * This will also clear interval if there no more wait job in the queue
   *
   * @param {Object} options
   * @param {String} options.slug - slug of the job
   */
  removeWaitJob({ slug }) {
    const queue = [...this.queue]
    const jobWithSameSlugIndex = queue.findIndex(job => job.konnector === slug)
    if (jobWithSameSlugIndex !== -1) {
      queue.splice(jobWithSameSlugIndex, 1)
      this.queue = queue
    }

    this.setter(this.queue)

    if (this.queue.length === 0) {
      this.clearInterval()
    }
  }

  /**
   * Set the interval of INTERVAL ms to check the queue
   */
  initInterval() {
    this.setIntervalId = setInterval(
      this.checkWaitJobQueue.bind(this),
      INTERVAL
    )
  }

  /**
   * Clear the interval
   */
  clearInterval() {
    if (this.setIntervalId !== null) {
      clearInterval(this.setIntervalId)
      this.setIntervalId = null
    }
  }
}
